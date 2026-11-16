import './globals.css';
import Header from '@components/Header';
import { App } from 'antd';

export const metadata = {
    title: 'Sistema Imobiliário',
    description: 'Sistema web para controle de clientes, imóveis e aluguéis',
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
            <body>
                <App>
                    <Header />
                    <main>{children}</main>
                </App>
            </body>
        </html>
    );
}
