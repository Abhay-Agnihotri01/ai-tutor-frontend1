import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Set axios baseURL globally before app starts
const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com'
console.log('API URL:', apiUrl, 'ENV:', import.meta.env.VITE_API_URL)
axios.defaults.baseURL = apiUrl

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)