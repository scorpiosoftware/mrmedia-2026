import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import AppRouter from '@/AppRouter';
import '../css/app.css';

createRoot(document.getElementById('app')).render(
    <BrowserRouter>
        <AppProvider>
            <AppRouter />
        </AppProvider>
    </BrowserRouter>
);
