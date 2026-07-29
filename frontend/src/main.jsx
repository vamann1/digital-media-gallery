import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// No StrictMode: the three.js scene is an imperative resource whose effect
// must run once. Cleanup/dispose is handled explicitly in App's useEffect.
createRoot(document.getElementById('root')).render(<App />)
