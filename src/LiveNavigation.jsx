import React from "react";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { LocateFixed, Navigation, RotateCcw, Square, Maximize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Approximate campus-wide view only; destination pins must come from geocoding or verified coordinates.
const CAMPUS_VIEW = [7.515, 4.52];
const icon = (html, size = [36, 36], anchor = [18, 18]) => L.divIcon({ className: 'nav-div-icon', html, iconSize: size, iconAnchor: anchor });
const userIcon = (heading) => icon(`<div class="gps-marker"><div class="gps-cone" style="transform:rotate(${Number.isFinite(heading) ? heading : 0}deg)"></div><div class="gps-dot"></div></div>`, [42,42], [21,21]);
const destinationIcon = icon('<div class="destination-marker"><span>★</span></div>', [34,42], [17,38]);
function MapResize({ follow, position }) { const map = useMap(); useEffect(() => { const id = setTimeout(() => map.invalidateSize(), 120); return () => clearTimeout(id); }, [map]); useEffect(() => { if (follow && position) map.panTo(position, { animate: true, duration: .35 }); }, [map, follow, position?.[0], position?.[1]]); return null; }

async function geocodePlace(place) {
  if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) return { lat: place.latitude, lon: place.longitude, display_name: place.name };
  const q = `${place.name}, Obafemi Awolowo University, Ile-Ife, Nigeria`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('The campus place search service is unavailable. Try again later.');
  const results = await response.json();
  const campus = results.find((r) => /ile-ife|obafemi|oau/i.test(`${r.display_name} ${r.name || ''}`));
  if (!campus) throw new Error(`No reliable map pin was found for “${place.name}”. Choose a GPS start or a destination with mapped coordinates.`);
  return { lat: Number(campus.lat), lon: Number(campus.lon), display_name: campus.display_name };
}
async function getWalkingRoute(from, to) {
  // Valhalla public demo is pedestrian-profile routing; it may rate-limit or lack campus footpath data.
  const payload = { locations: [{ lat: from.lat, lon: from.lon }, { lat: to.lat, lon: to.lon }], costing: 'pedestrian', units: 'kilometers', directions_options: { units: 'kilometers' } };
  const response = await fetch(`https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify(payload))}`);
  if (!response.ok) throw new Error('The pedestrian routing service is unavailable or busy. Please try again shortly.');
  const data = await response.json();
  if (data.error || !data.trip?.legs?.length) throw new Error(data.error || 'No mapped pedestrian route was found between these points. No route has been drawn.');
  const shape = data.trip.legs.flatMap((leg) => decodePolyline(leg.shape, 6));
  return { points: shape, km: data.trip.summary.length, minutes: data.trip.summary.time / 60, steps: data.trip.legs.flatMap((leg) => leg.maneuvers || []).map((m) => m.instruction).filter(Boolean) };
}
function decodePolyline(encoded, precision = 6) { let index=0, lat=0, lng=0, coords=[]; while(index<encoded.length){ let b,shift=0,result=0; do{b=encoded.charCodeAt(index++)-63;result|=(b&0x1f)<<shift;shift+=5;}while(b>=0x20); const dlat=(result&1)?~(result>>1):(result>>1);lat+=dlat;shift=0;result=0;do{b=encoded.charCodeAt(index++)-63;result|=(b&0x1f)<<shift;shift+=5;}while(b>=0x20);const dlng=(result&1)?~(result>>1):(result>>1);lng+=dlng;coords.push([lat/10**precision,lng/10**precision]);}return coords; }
function metresBetween(a,b) { const R=6371000, p1=a[0]*Math.PI/180,p2=b[0]*Math.PI/180,dp=(b[0]-a[0])*Math.PI/180,dl=(b[1]-a[1])*Math.PI/180; const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }

export default function LiveNavigation({ startPlace, destinationPlace, onEnd }) {
  const [position, setPosition] = useState(null); const [accuracy, setAccuracy] = useState(null); const [heading, setHeading] = useState(null); const [route, setRoute] = useState(null); const [status, setStatus] = useState('Tap Start Navigation to request GPS permission and calculate a pedestrian route.'); const [busy, setBusy] = useState(false); const [follow, setFollow] = useState(true); const [active, setActive] = useState(false); const [arrivalCount, setArrivalCount] = useState(0); const [arrived, setArrived] = useState(false); const [fullScreen, setFullScreen] = useState(false); const [stepIndex, setStepIndex] = useState(0); const watchRef = useRef(null); const previousRef = useRef(null); const mapInstanceRef = useRef(null);
  const stopGps = () => { if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; };
  useEffect(() => () => stopGps(), []);
  useEffect(() => { if (!fullScreen) return; const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }, [fullScreen]);
  const locate = () => new Promise((resolve, reject) => { if (!navigator.geolocation) return reject(new Error('This browser does not support GPS location.')); navigator.geolocation.getCurrentPosition((p) => resolve(p), (e) => reject(new Error(e.code===1?'Location permission was denied. Allow location access or choose a manual starting point.':e.code===2?'Your location is unavailable. Move to an open area or choose a manual starting point.':'GPS timed out. Try again or choose a manual starting point.')), { enableHighAccuracy:true, timeout:15000, maximumAge:3000 }); });
  const startNavigation = async () => {
    setBusy(true); setRoute(null); setArrived(false); setArrivalCount(0); setStepIndex(0);
    try {
      let from;
      if (startPlace?.id === '__gps__') { setStatus('Location is used to show your position and keep the walking route updated. Your browser will ask permission.'); const p = await locate(); from = { lat:p.coords.latitude, lon:p.coords.longitude }; setPosition([from.lat,from.lon]); setAccuracy(p.coords.accuracy); setHeading(Number.isFinite(p.coords.heading) ? p.coords.heading : null); }
      else { if (!startPlace) throw new Error('Choose a starting point or select Use my GPS.'); const p = await geocodePlace(startPlace); from = { lat:p.lat, lon:p.lon }; }
      if (!destinationPlace) throw new Error('Choose a destination first.');
      const to = await geocodePlace(destinationPlace);
      const result = await getWalkingRoute(from,to); setRoute({ ...result, from, to }); setStatus('Pedestrian route calculated from OpenStreetMap-based routing data. Follow the mapped path and observe campus signs.'); setActive(true);
      if (startPlace?.id === '__gps__') { stopGps(); watchRef.current = navigator.geolocation.watchPosition((p) => { const next=[p.coords.latitude,p.coords.longitude]; setPosition(next); setAccuracy(p.coords.accuracy); if (Number.isFinite(p.coords.heading) && p.coords.speed > 0.5) setHeading(p.coords.heading); else if (previousRef.current && metresBetween(previousRef.current,next)>5 && p.coords.accuracy < 35) { const a=previousRef.current; setHeading((Math.atan2(next[1]-a[1],next[0]-a[0])*180/Math.PI+360)%360); } previousRef.current=next; const near=metresBetween(next,[to.lat,to.lon]); if (near < 25 && p.coords.accuracy <= 35) setArrivalCount((n)=>{ if(n+1>=3){setArrived(true);setStatus(`You've arrived near ${destinationPlace.name}. Check the building entrance to confirm.`);stopGps();setActive(false);}return n+1; }); else setArrivalCount(0); }, (e) => setStatus(e.code===1?'Location permission was denied; live tracking has stopped.': 'GPS signal lost. The last position may be outdated.'), { enableHighAccuracy:true, maximumAge:1500, timeout:15000 }); }
    } catch (e) { setStatus(e.message || 'Navigation could not start.'); setActive(false); }
    finally { setBusy(false); }
  };
  const endNavigation = () => { stopGps(); setActive(false); setRoute(null); setArrived(false); setStatus('Navigation ended. You can choose another destination and start again.'); onEnd?.(); };
  const recenter = () => { setFollow(true); if (position && mapInstanceRef.current) mapInstanceRef.current.panTo(position); };
  const map = <MapContainer center={position || CAMPUS_VIEW} zoom={position ? 17 : 14} scrollWheelZoom className="live-leaflet-map" whenReady={(e)=>{mapInstanceRef.current=e.target;}}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><MapResize follow={follow && active} position={position}/>{position && <Marker position={position} icon={userIcon(heading)}><Popup>Your current GPS position<br/>Accuracy: {accuracy ? `±${Math.round(accuracy)} m` : 'unknown'}</Popup></Marker>}{route && <><Marker position={[route.to.lat,route.to.lon]} icon={destinationIcon}><Popup>{destinationPlace?.name || 'Destination'}</Popup></Marker><Polyline positions={route.points} pathOptions={{ color:'#176b45', weight:6, opacity:.88 }} /></>}</MapContainer>;
  return <section className={`live-nav ${fullScreen?'live-nav-fullscreen':''}`}><div className="live-nav-head"><div><span className="section-kicker">LIVE CAMPUS MAP</span><h3>{active ? `Navigating to ${destinationPlace?.name}` : 'Map & walking navigation'}</h3><p>{status}</p></div><button className="map-icon-button" onClick={()=>setFullScreen(!fullScreen)} title={fullScreen?'Exit full screen':'Full-screen map'}><Maximize2 size={18}/></button></div><div className="live-map-frame">{map}<div className="map-overlay-controls"><button onClick={async()=>{try{const p=await locate();setPosition([p.coords.latitude,p.coords.longitude]);setAccuracy(p.coords.accuracy);setStatus(`GPS position updated. Accuracy ±${Math.round(p.coords.accuracy)} m.`);}catch(e){setStatus(e.message);}}} className="map-icon-button" title="Locate me"><LocateFixed size={18}/></button><button onClick={recenter} className="map-icon-button" title="Recenter map"><RotateCcw size={18}/></button></div></div>{route && <div className="live-route-details"><div><small>ROUTE DISTANCE</small><strong>{route.km < 1 ? `${Math.round(route.km*1000)} m` : `${route.km.toFixed(1)} km`}</strong></div><div><small>EST. WALKING TIME</small><strong>{Math.max(1,Math.round(route.minutes))} min</strong></div><div><small>GPS ACCURACY</small><strong>{accuracy ? `±${Math.round(accuracy)} m` : 'Not tracking'}</strong></div></div>}{route?.steps?.length>0 && <div className="live-instructions"><span className="section-kicker">NEXT DIRECTIONS</span><strong>{route.steps[Math.min(stepIndex,route.steps.length-1)]}</strong><div className="instruction-actions"><button className="button button-light" disabled={stepIndex===0} onClick={()=>setStepIndex(i=>Math.max(0,i-1))}>Previous</button><span>{Math.min(stepIndex+1,route.steps.length)} of {route.steps.length}</span><button className="button button-light" disabled={stepIndex>=route.steps.length-1} onClick={()=>setStepIndex(i=>Math.min(route.steps.length-1,i+1))}>Next</button></div></div>}{arrived && <div className="arrival-message" role="status">✓ You appear to have arrived near {destinationPlace?.name}. Please confirm the correct entrance.</div>}<div className="live-nav-actions"><button className="button button-green" disabled={busy || active} onClick={startNavigation}><Navigation size={17}/>{busy?'Calculating route…':active?'Navigation active':'Start Navigation'}</button><button className="button button-light" disabled={!active && !route} onClick={endNavigation}><Square size={16}/> End Navigation</button><label className="follow-toggle"><input type="checkbox" checked={follow} onChange={e=>setFollow(e.target.checked)}/> Follow me</label></div><p className="routing-footnote">Map tiles © OpenStreetMap contributors. Walking routes use the public Valhalla pedestrian demo and may be limited by missing paths or service availability. Geocoding can resolve the wrong campus feature; check the destination pin before walking. GPS/arrival accuracy is not guaranteed. Keep this page open while navigating.</p></section>;
}
