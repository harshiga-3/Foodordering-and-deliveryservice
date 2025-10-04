import React, { useEffect, useRef, useState } from 'react';

// Renders Google Identity button and emits a credential via onSuccess(credential)
export default function GoogleSignInButton({ onSuccess, theme = 'outline', size = 'large', text = 'continue_with' }) {
  const btnRef = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let scriptEl;
    const ensureScript = () => new Promise((resolve, reject) => {
      if (window.google && window.google.accounts && window.google.accounts.id) return resolve();
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://accounts.google.com/gsi/client';
      scriptEl.async = true;
      scriptEl.defer = true;
      scriptEl.onload = () => resolve();
      scriptEl.onerror = reject;
      document.head.appendChild(scriptEl);
    });

    const init = async () => {
      try {
        await ensureScript();
        if (!clientId) {
          console.error('VITE_GOOGLE_CLIENT_ID is not set');
          return;
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const cred = response?.credential;
            if (cred && typeof onSuccess === 'function') onSuccess(cred);
          },
        });
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme,
            size,
            text,
            width: '100%',
            type: 'standard',
          });
        }
        setReady(true);
      } catch (e) {
        console.error('Failed to load Google Identity script', e);
      }
    };

    init();
    return () => {
      if (scriptEl) {
        // keep script cached; no cleanup
      }
    };
  }, [clientId, onSuccess, theme, size, text]);

  return <div ref={btnRef} style={{ display: 'inline-block', width: '100%' }} aria-busy={!ready} />;
}
