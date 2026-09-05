import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ReactLenis } from 'lenis/react'
import { AuthProvider } from './AuthContext.jsx'
import { LanguageProvider } from './LanguageContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LanguageProvider>
            <AuthProvider>
                <ReactLenis
                    root
                    options={{
                        lerp: 0.08,
                        duration: 1.5,
                        smoothWheel: true,
                    }}
                >
                    <App />
                </ReactLenis>
            </AuthProvider>
        </LanguageProvider>
    </React.StrictMode>,
)
