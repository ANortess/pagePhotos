import React, {useState, useRef, useEffect} from 'react';
import './MainAlbums.css';
import './OptionsContent.css';
import SettingsView from './SettingsAlbum'; 

// Componente para la Vista de Opciones
function AlbumCard({ album, onAlbumClick  }) {
    return (
        <div 
            className="album-card"
            onClick={() => onAlbumClick(album)}
        >
            <span className="album-title">{album.title}</span>
        </div>
    );
}

function MainAlbums({ albums, setAlbums, isAddModalOpen, handleSaveNewAlbum, handleNone, onOpenAddAlbum, onOpenSettings, handleLogout}) { // 🔥 Recibe la lista de álbumes como prop
    const albumList = Array.isArray(albums) ? albums : [];
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [modalMode, setModalMode] = useState('viewAllAlbums'); 
    const [stateOfSettings, setStateOfSettings] = useState('_hall'); 
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isEditModePhotos, setIsEditModePhotos] = useState(false);

    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false); 
    const fileInputRef = useRef(null); // Ref para el input de archivo oculto
    const [pendingUploads, setPendingUploads] = useState(0);
    const [albumPhotos, setAlbumPhotos] = useState([]); // Para almacenar las fotos cargadas
    const API_BASE_URL = process.env.MYSQL_URLFRONTEND || 'http://localhost:3001';

    const fetchPhotos = async (albumId) => {
        const token = localStorage.getItem('authToken');

        setIsLoadingPhotos(true); 

        try {
            const response = await fetch(`${API_BASE_URL}/albums/${albumId}/photos`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAlbumPhotos(data);
            } else {
                console.error('Error al cargar fotos');
                setAlbumPhotos([]);
            }
        } catch (error) {
            console.error('Error de red al cargar fotos:', error);
        } finally {
            setIsLoadingPhotos(false); 
        }
    };

    const handleAlbumClick = (album) => {
        setSelectedAlbum(album);
        fetchPhotos(album.id);
    };

    useEffect(() => {
        if (selectedAlbum && !isLoadingPhotos && albumPhotos.length >= 0) {
            setModalMode('lookContent');
        }
    }, [isLoadingPhotos, selectedAlbum, albumPhotos]); 

    const showAllAlbums = () => {
        setModalMode('viewAllAlbums');
    };

    const handleInfoDetails = () => {
        setStateOfSettings('_info');
    };

    const handleEditDetails = () => {
        setStateOfSettings('_edit');
    };

    const handleDeleteAlbum = () => {
        setStateOfSettings('_delete');
    };

    const handleCloseDetails = () => {
        handleNone();
        handleInfoDetails();
    };

    const handleAlbumDeleted = (deletedAlbumId) => {
        setAlbums(prevAlbums => prevAlbums.filter(a => a.id !== deletedAlbumId));
        setSelectedAlbum(null); 
    };

    const handleUpdateAlbum = (updatedAlbum) => {
        setAlbums(prevAlbums => 
            prevAlbums.map(album => 
                album.id === updatedAlbum.id ? { ...album, ...updatedAlbum } : album
            )
        );
        // Además, actualiza el selectedAlbum para reflejar el cambio en el modal si no se cierra inmediatamente
        setSelectedAlbum(prevSelected => 
            prevSelected && prevSelected.id === updatedAlbum.id ? { ...prevSelected, ...updatedAlbum } : prevSelected
        );
    };
    
    const handleOpenSettingsModal = () => {
        onOpenSettings(); 
        setStateOfSettings('_info');
    };

    const toggleOptionsMenu = () => {
        setIsOptionsMenuOpen(prev => !prev);
    };

    const editPhotosModal = () => {
        setIsEditModePhotos(prev => !prev);
    }

    const handleFileSelect = (event) => {
        const files = event.target.files;
        
        if (files && files.length > 0 && selectedAlbum) {
            
            // 🔥 CLAVE: Establece el contador al total de archivos seleccionados
            setPendingUploads(prev => prev + files.length); 
            
            // Itera y llama a la subida para CADA archivo
            Array.from(files).forEach(file => {
                uploadPhoto(file, selectedAlbum.id); 
            });
        }

        // Limpia el input para permitir seleccionar más archivos (incluso si son los mismos)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadPhoto = async (file, albumId) => {
        const token = localStorage.getItem('authToken');

        const formData = new FormData();
        formData.append('photoFile', file); // Multer espera un solo archivo aquí

        try {
            const response = await fetch(`${API_BASE_URL}/albums/${albumId}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const newPhoto = await response.json(); 

            if (response.ok) {
                // Añade la nueva foto (con la URL final) a la lista
                setAlbumPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
                console.log('Foto subida con éxito:', newPhoto.url);
            } else {
                console.error('Error al subir foto:', newPhoto.message);
            }
        } catch (error) {
            console.error('Error de red al subir foto:', error);
        } finally {
            // 🔥 CLAVE: Al finalizar ESTA subida, RESTA 1 del contador
            setPendingUploads(prev => Math.max(0, prev - 1)); 
        }
    };

    return (
        <>
            {modalMode === 'viewAllAlbums' && (
                <>
                    <div className="name-of-page">
                        <span>Álbums</span>
                    </div>
                    <div className="gallery-content">
                        <div className="albums-grid"> 
                            {/* 🔥 Mapeamos la lista para crear una tarjeta por cada álbum */}
                            {albumList.map(album => (
                                <AlbumCard 
                                    key={album.id} 
                                    album={album}
                                    onAlbumClick={handleAlbumClick} 
                                />
                            ))}
                            
                            {/* Mensaje cuando no hay álbumes */}
                            {albumList.length === 0 && (
                                <p className="no-albums-message">¡Añade tu primer álbum!</p>
                            )}
                        </div>
                    </div>
                    

                    <div className="main-buttons">
                        <button className="options-button" disabled></button>
                        <button 
                            onClick={onOpenAddAlbum} 
                            className="addAlbum-button"
                        >
                            Añadir Álbum
                        </button>
                        <button 
                            onClick={toggleOptionsMenu}
                            className="options-button"
                        ></button>
                    </div>

                    {isOptionsMenuOpen && (
                        <OptionsMenuPopup
                            onClose={handleLogout}
                            toggleOptionsMenu={toggleOptionsMenu}
                        />
                    )}

                    {isAddModalOpen === 'addAlbum' && (
                        <AddAlbumModal
                            onSave={handleSaveNewAlbum}
                            onCancel={handleNone}
                        />
                    )}
                </>
                
            )}

            {modalMode === 'lookContent' && (
                <>
                    <div className="name-of-page">
                        <span>Álbums</span>
                    </div>
                    <div className="gallery-content">
                        <input
                            type="file"
                            accept="image/*" // Solo acepta imágenes
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            style={{ display: 'none' }} // Ocultar visualmente
                            disabled={pendingUploads > 0}
                        />

                        <div className="photos-grid">
                            {pendingUploads > 0 && 
                                <p className="loading-message">Subiendo foto(s)... ({pendingUploads} pendiente(s))</p>}
                                
                                {albumPhotos.length > 0 ? (
                                    albumPhotos.map(photo => (
                                        <div key={photo.id} className="photo-card">
                                            <img 
                                                src={photo.url} 
                                                alt={`Foto ${photo.id}`} 
                                                className="album-photo"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    pendingUploads === 0 && <p className="no-albums-message">No hay fotos en este álbum.</p>
                            )}
                        </div>
                    </div>
                    

                    <div className="main-buttons">
                        {!isEditModePhotos && (
                            <>
                                <button 
                                    onClick={handleOpenSettingsModal} 
                                    className="addAlbum-button"

                                >
                                    Detalles
                                </button>

                                <button 
                                    onClick={showAllAlbums} 
                                    className="addAlbum-button modalPhotos-no-button"
                                >
                                    Volver
                                </button>

                                <button 
                                    onClick={editPhotosModal} 
                                    className="addAlbum-button"

                                >
                                    Editar
                                </button>
                            </>
                            
                        )}

                        {isEditModePhotos && (
                            <>
                                <button 
                                    onClick={() => fileInputRef.current.click()} 
                                    className="addAlbum-button"
                                    // 🔥 Ahora se deshabilita si pendingUploads > 0
                                    disabled={pendingUploads > 0}
                                >
                                    {/* 🔥 Muestra el estado según el contador */}
                                    {pendingUploads > 0 ? `Subiendo... (${pendingUploads})` : 'Añadir'}
                                </button>

                                {/* Botón Volver (salir del modo edición) */}
                                <button 
                                    onClick={editPhotosModal} 
                                    className="addAlbum-button modalPhotos-no-button"
                                    disabled={pendingUploads > 0}
                                >
                                    Volver
                                </button>
                                
                                <button 
                                    onClick={handleOpenSettingsModal} 
                                    className="addAlbum-button"
                                    disabled={pendingUploads > 0}
                                >
                                    Eliminar
                                </button>
                            </>
                        )}
                        
                    </div>

                    {isAddModalOpen === 'settings' && (
                        <SettingsView
                            album={selectedAlbum}
                            mode={stateOfSettings}
                            onInfo={handleInfoDetails}
                            onEdit={handleEditDetails}
                            onClose={handleCloseDetails}
                            onUpdate={handleUpdateAlbum}
                            onDelete={handleDeleteAlbum}
                            OnShowAllAlbums={showAllAlbums}
                            onAlbumDeleted={handleAlbumDeleted} 
                        />
                    )}

                    {isLoadingPhotos && <LoadingPopup />}
                </>
            )}
        </>
    );
}

function AddAlbumModal({ onSave, onCancel }) {
    // Estado local para los campos del formulario
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [showError, setShowError] = useState(false); 
    const messageError = 'El título es obligatorio.';
    // Maneja la acción de Guardar
    const handleSave = () => {
        // Validación simple (puedes hacerla más robusta)
        if (title.trim()) {
            // Llama a la función onSave del padre con los datos
            onSave(title, description);
            // Cierra el modal (onSave en el padre debería incluir la lógica para cerrarlo)
        } else {
            setShowError(true);

            setTimeout(() => {
                setShowError(false);
            }, 3000); 
        }
    };

   

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3>Añadir Nuevo Álbum</h3>
                
                {/* Campo de Título */}
                <div className="addAlbum-form">
                    <span className="albumTitle">Título</span>
                    {showError && (
                        <span className="form-note">{messageError}</span>
                    )}
                    <input 
                        id="albumTitle"
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título del álbum (obligatorio)"
                    />
                </div>

                {/* Campo de Descripción */}
                <div className="addAlbum-form">
                    <span className="albumTitle">Descripción (Opcional)</span>
                    <textarea 
                        id="albumDescription"
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción breve del álbum"
                        rows="3"
                    />
                </div>

                <div className="modal-buttons">
                    <button onClick={handleSave} className="modal-yes-button">Guardar</button>
                    <button onClick={onCancel} className="modal-no-button">Cancelar</button>
                </div>

            </div>
        </div>
    );
}

function OptionsMenuPopup({ onClose, toggleOptionsMenu }) {
    return (
        <div className="modal-backdrop">
            <div className="modal-content options-menu-popup">
                <h3>¿Quieres cerrar sesión?</h3>
                <div className="modal-buttons">
                    <button onClick={onClose} className="modal-yes-button">Si</button>
                    <button onClick={toggleOptionsMenu} className="modal-no-button">No</button>
                </div>
            </div>
        </div>
    );
}

function LoadingPopup() {
    return (
        <div className="modal-backdrop loading-backdrop">
            <div className="modal-content loading-content">
                <h3>Cargando fotos...</h3>
                {/* Puedes poner un spinner o icono aquí */}
                <div className="spinner"></div> 
            </div>
        </div>
    );
}

export default MainAlbums; 