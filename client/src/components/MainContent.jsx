import { useState, useEffect } from 'react';

import './MainContent.css';
import AlbumsView from './MainAlbums'; 

function MainContent({ handleLogout }) {
    const [albums, setAlbums] = useState([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState('none');
    const [isLoading, setIsLoading] = useState(true);
    
    const handleNone = () => {
        setIsAddModalOpen('none');
    };

    const handleAddAlbum = () => {
        setIsAddModalOpen('addAlbum');
    };

    const handleSettings = () => {
        setIsAddModalOpen('settings');
    };
    
    const API_BASE_URL = process.env.MYSQL_URLFRONTEND || 'http://localhost:3001';
    useEffect(() => {
        const fetchAlbums = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/albums`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setAlbums(data);
                } else {
                    // Manejar errores de token expirado o de servidor
                    console.error('Error al cargar álbumes:', response.status);
                }
            } catch (error) {
                console.error('Error de red al cargar álbumes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlbums();
    }, []);

    const handleSaveNewAlbum = async (title, description) => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${API_BASE_URL}/albums`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Envía el token
                },
                body: JSON.stringify({ title, description }),
            });

            const newAlbum = await response.json();

            if (response.ok) {
                setAlbums(prevAlbums => [...prevAlbums, newAlbum]);
                handleNone();
            } else {
                console.error('Error al guardar en DB:', data.message);
                // Mostrar un error al usuario si la API falla
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    };

    const mainContent = (
        <>
            <AlbumsView
                albums={albums} 
                setAlbums={setAlbums}
                isAddModalOpen={isAddModalOpen}
                handleSaveNewAlbum={handleSaveNewAlbum}
                handleNone={handleNone}
                onOpenAddAlbum={handleAddAlbum}
                onOpenSettings={handleSettings}
                handleLogout={handleLogout}
            />
        </>
    )

    return (
        <> 
            <div className="welcome-content">
                {mainContent}
            </div>
        </>
    );
}

export default MainContent;
