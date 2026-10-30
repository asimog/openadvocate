import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { Session } from './session.ts';
import './styles.css';

const session = new Session();
await session.open();
createRoot(document.getElementById('root')!).render(<App session={session} />);
