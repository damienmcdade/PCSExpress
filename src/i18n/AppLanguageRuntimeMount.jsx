/*
 * Thin guard component around the heavy app-language runtime + Google
 * Translate runtime. The combined runtime carries ~90 KB of inline
 * translation dictionaries plus the Google Translate widget bootstrap;
 * for English-locale users it's a no-op. Mounting this component is
 * gated in App.jsx on `appLanguage !== 'en'`, and the import itself
 * lives behind React.lazy() so the runtime bytes never download for
 * default-English users.
 */

import { useEffect } from 'react';
import { useAppLanguageRuntime } from './useAppLanguageRuntime';
import { applyGoogleTranslateLanguage } from './googleTranslateRuntime';

export default function AppLanguageRuntimeMount({ lang }) {
  useAppLanguageRuntime(lang);
  useEffect(() => {
    applyGoogleTranslateLanguage(lang);
  }, [lang]);
  return null;
}
