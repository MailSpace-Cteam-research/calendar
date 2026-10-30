import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, AppRoot } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
// Тема Календаря Mail из @vkontakte/vkui-tokens (светлая и тёмная), подключается через tokensClassNames
import '@vkontakte/vkui-tokens/themes/calendar/cssVars/declarations/onlyVariablesLocal.css';
import '@vkontakte/vkui-tokens/themes/calendarDark/cssVars/declarations/onlyVariablesLocal.css';
import './styles.css';
import App from './App';
import FigmaCalendar from './FigmaCalendar';
import { Button } from '@vkontakte/vkui';

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
  const [classic, setClassic] = useState(false);
  return (
    <ConfigProvider
      colorScheme={colorScheme}
      platform="vkcom"
      tokensClassNames={{ light: 'vkui--calendar--light', dark: 'vkui--calendar--dark' }}
    >
      <AppRoot>
        {classic ? <><div style={{ padding: 12 }}><Button mode="secondary" onClick={() => setClassic(false)}>← Новый макет Figma</Button></div><App /></> : <FigmaCalendar onLegacy={() => setClassic(true)} />}
      </AppRoot>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);