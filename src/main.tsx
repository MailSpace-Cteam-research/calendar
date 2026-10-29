import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, AppRoot } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
// Тема Календаря Mail из @vkontakte/vkui-tokens (светлая и тёмная), подключается через tokensClassNames
import '@vkontakte/vkui-tokens/themes/calendar/cssVars/declarations/onlyVariablesLocal.css';
import '@vkontakte/vkui-tokens/themes/calendarDark/cssVars/declarations/onlyVariablesLocal.css';
import './styles.css';
import App from './App';
import Calendar from './calendar/Calendar';

/** Основа Календаря по макету — по умолчанию; прежний концепт формы — по адресу #concept */
function Screen() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return hash === '#concept' ? <App /> : <Calendar />;
}

/** Артефакт может явно выставить тему через data-theme на <html>; иначе VKUI берёт prefers-color-scheme */
function useHostColorScheme() {
  const read = () => {
    const t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' || t === 'light' ? t : undefined;
  };
  const [scheme, setScheme] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setScheme(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return scheme;
}

function Root() {
  const colorScheme = useHostColorScheme();
  return (
    <ConfigProvider
      colorScheme={colorScheme}
      platform="vkcom"
      tokensClassNames={{ light: 'vkui--calendar--light', dark: 'vkui--calendar--dark' }}
    >
      <AppRoot>
        <Screen />
      </AppRoot>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
