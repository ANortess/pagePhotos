import React, {useState, useRef, useEffect} from 'react';
import './MainAlbums.css';
import './OptionsContent.css';
import SettingsView from './SettingsAlbum'; 

// Componente para la Vista de Opciones
function AlbumCard({ album, onAlbumClick  }) {
    const coverUrl = album.cover_photo_url;
    
    return (
        <div 
            className="album-card"
            onClick={() => onAlbumClick(album)}
        >
            {coverUrl && (
                <img 
                    src={coverUrl} 
                    alt="Portada" 
                    className="album-cover-image"
                />
            )}
            <div className="album-title-container"> 
                <span className="album-title-text">{album.title}</span>
            </div>
        </div>
    );
}

function MainAlbums({ albums, setAlbums, isAddModalOpen, handleSaveNewAlbum, handleNone, onOpenAddAlbum, onOpenSettings, handleLogout}) { // 🔥 Recibe la lista de álbumes como prop
    const albumList = Array.isArray(albums) ? albums : [];
    const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);

    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [modalMode, setModalMode] = useState('viewAllAlbums'); 
    const [stateOfSettings, setStateOfSettings] = useState('_hall'); 
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isEditModePhotos, setIsEditModePhotos] = useState(false);

    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false); 
    const fileInputRef = useRef(null); // Ref para el input de archivo oculto
    const [pendingUploads, setPendingUploads] = useState(0);
    const [albumPhotos, setAlbumPhotos] = useState([]); // Para almacenar las fotos cargadas
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pagephotos-production-up.railway.app' /*'http://localhost:3001'*/;

    const [isCoverSelectionMode, setIsCoverSelectionMode] = useState(false);
    const [isDeleteSelectionMode, setIsDeleteSelectionMode] = useState(false);
    const [isDeletePhotosConfirm, setIsDeletePhotosConfirm] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };
    
    const toggleCoverSelectionMode = () => {
        // Al hacer clic en el botón "Cambiar Portada"
        setIsCoverSelectionMode(prevMode => !prevMode);
    };

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
        isMobileMenuOpen(false);
        setIsEditModePhotos(false);
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

    const handleCoverDetails = () => {
        setStateOfSettings('_cover');
    };

    const handleDeleteAlbum = () => {
        console.log("asdad")
        setStateOfSettings('_deleteAlbum');
    };

    const handleDeletePhoto = () => {
        setStateOfSettings('_deletePhoto');
    };

    const handleViewPhoto = (photo) => {
        setSelectedPhoto(photo);
        setStateOfSettings('_viewPhoto');
    }

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
        if (isEditModePhotos) {
            // En lugar de abrir el modal de settings, inicia el modo de selección
            toggleDeleteSelectionMode();
        } else {
            // Si no estás en edición, abre el modal de detalles del álbum
            onOpenSettings(); 
            setStateOfSettings('_info');
        }
    };

    const toggleOptionsMenu = () => {
        setIsOptionsMenuOpen(prev => !prev);
    };

    const toggleDeletePhotosConfirm = () => {
        setIsDeletePhotosConfirm(prev => !prev);
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

    const deletePhoto = async (photoId, albumId) => {
        const token = localStorage.getItem('authToken');

        console.log(photoId);
        console.log(albumId);
        if (!token) {
            alert("No hay token para autenticar la eliminación.");
            return;
        }
        
        const deleteUrl = `${API_BASE_URL}/albums/${albumId}/photos/${photoId}`;

        try {
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                console.log(`Foto ${photoId} eliminada con éxito.`);
                
                setAlbumPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
                handleNone();

            } else {
                const errorData = await response.json();
                console.error('Error al borrar foto:', errorData);
                alert(`Error al eliminar la foto: ${errorData.message || response.statusText}`);
            }

        } catch (error) {
            console.error('Error de red al borrar foto:', error);
            alert('Error de red al intentar borrar la foto.');
        }
    };

    const handleSetCover = async (photoUrl) => {
        // ⚠️ Asegúrate de tener el token y el ID del álbum disponibles
        const authToken = localStorage.getItem('authToken');
        const albumId = selectedAlbum.id; 

        // Opcional: Mostrar un loading o deshabilitar la interfaz

        try {
            const response = await fetch(`${API_BASE_URL}/albums/${albumId}/cover`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ photoUrl }),
            });

            if (!response.ok) {
                throw new Error('Error al establecer la portada en el servidor.');
            }
            
            // Actualizar el estado del álbum seleccionado para reflejar la nueva portada inmediatamente
            setSelectedAlbum(prevAlbum => ({
                ...prevAlbum,
                cover_photo_url: photoUrl // ¡Actualizamos la URL de la portada!
            }));

            setAlbums(prevAlbums => 
                prevAlbums.map(album => 
                    album.id === albumId 
                        ? { ...album, cover_photo_url: photoUrl }
                        : album
                )
            );
            
            setIsCoverSelectionMode(false); 
            onOpenSettings();
            handleCoverDetails();
            
        } catch (error) {
            console.error('Fallo al actualizar la portada:', error);
            alert('No se pudo cambiar la portada.');
        }
    };

    const deleteMultiplePhotos = async () => {
        if (selectedPhotoIds.length === 0 || !selectedAlbum) return;
        
        const albumId = selectedAlbum.id;
        const token = localStorage.getItem('authToken');
        let successfulDeletions = 0;
        
        // Opcional: Mostrar un estado de "Borrando en lote..."
        // Inicia el proceso de eliminación para cada ID
        
        const deletionPromises = selectedPhotoIds.map(photoId => 
            // Reutiliza tu función deletePhoto, o la lógica de la API
            fetch(`${API_BASE_URL}/albums/${albumId}/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            .then(response => {
                if (response.ok || response.status === 204) {
                    successfulDeletions++;
                    return { success: true, id: photoId };
                }
                return { success: false, id: photoId };
            })
            .catch(error => {
                console.error(`Error de red al borrar foto ${photoId}:`, error);
                return { success: false, id: photoId };
            })
        );

        const results = await Promise.all(deletionPromises);

        // Filtrar fotos eliminadas exitosamente de la lista local
        const successfullyDeletedIds = results
            .filter(r => r.success)
            .map(r => r.id);
            
        setAlbumPhotos(prevPhotos => 
            prevPhotos.filter(photo => !successfullyDeletedIds.includes(photo.id))
        );

        setSelectedPhotoIds([]);
        toggleDeleteSelectionMode(); 
        toggleDeletePhotosConfirm();
    };

    const handlePhotoClick = (photo) => {
        // 1. Modo de SELECCIÓN DE PORTADA
        if (isCoverSelectionMode) {
            handleSetCover(photo.url);
        // 2. Modo de SELECCIÓN DE ELIMINACIÓN
        } else if (isDeleteSelectionMode) {
            // Alternar la selección de la foto
            setSelectedPhotoIds(prevIds => {
                if (prevIds.includes(photo.id)) {
                    // Deseleccionar
                    return prevIds.filter(id => id !== photo.id);
                } else {
                    // Seleccionar
                    return [...prevIds, photo.id];
                }
            });
        // 3. Modo NORMAL (Ver foto)
        } else {
            onOpenSettings();
            handleViewPhoto(photo);
        }
    };

    const toggleDeleteSelectionMode = () => {
        // Si lo activas, asegúrate de que no haya fotos seleccionadas previamente
        if (!isDeleteSelectionMode) {
            setSelectedPhotoIds([]);
        }
        setIsDeleteSelectionMode(prev => !prev);
    };

    return (
        <>
            {modalMode === 'viewAllAlbums' && (
                <>
                    <div className="name-of-page">
                        <span>Álbums</span>

                        <button 
                            className={`mobile-menu-icon ${isMobileMenuOpen ||isEditModePhotos ? 'mobile-menu-icon-hidden':''}`}
                            onClick={toggleMobileMenu}
                        >
                            ☰ 
                        </button>
                    </div>

                    {isMobileMenuOpen && (
                        <div className="menu-overlay" 
                            onClick={toggleMobileMenu}
                            >    
                        </div>
                    )}
                    <div 
                        className= {`menu-background ${isMobileMenuOpen ? 'menu-open' : ''}`}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <button onClick={ () => {
                            onOpenAddAlbum();
                            toggleMobileMenu();
                        }} className="menu-button">Añadir</button>
                        <button onClick={ () => {
                            toggleOptionsMenu();
                            toggleMobileMenu();
                        }} className="menu-button">Cerrar</button>
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
                        <span>Fotos</span>
                        <button 
                            className={`mobile-menu-icon ${isMobileMenuOpen ||isEditModePhotos ? 'mobile-menu-icon-hidden':''}`}
                            onClick={toggleMobileMenu}
                        >
                            ☰ 
                        </button>
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
                                        <div 
                                            key={photo.id} 
                                            className={`photo-card 
                                                ${isCoverSelectionMode ? 'cover-select-mode' : ''}
                                                ${isDeleteSelectionMode && selectedPhotoIds.includes(photo.id) ? 'selected-for-delete' : ''}
                                            `}
                                            onClick={() => handlePhotoClick(photo)}
                                        >
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
                        {!isEditModePhotos && !isCoverSelectionMode && !isDeleteSelectionMode && (
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

                        {isEditModePhotos && !isCoverSelectionMode && !isDeleteSelectionMode && (
                            <>
                                <button 
                                    onClick={() => fileInputRef.current.click()} 
                                    className="addAlbum-button"
                                    disabled={pendingUploads > 0}
                                >
                                    {pendingUploads > 0 ? `Subiendo... (${pendingUploads})` : 'Añadir'}
                                </button>

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
                            onCover={handleCoverDetails}
                            onClose={handleCloseDetails}
                            onUpdate={handleUpdateAlbum}
                            onDeleteAlbum={handleDeleteAlbum}
                            onDeletePhoto={handleDeletePhoto}
                            OnShowAllAlbums={showAllAlbums}
                            onAlbumDeleted={handleAlbumDeleted} 
                            onSetCover={toggleCoverSelectionMode}
                            onViewPhoto={selectedPhoto}
                            onFunctionDeletePhoto={deletePhoto} 
                            onDeletePhotosConfirm={toggleDeletePhotosConfirm}
                        />
                    )}

                    {isLoadingPhotos && <LoadingPopup />}

                    {isDeleteSelectionMode && (
                        <>
                        <div className='main-buttons'>
                            <button 
                                onClick={toggleDeletePhotosConfirm} 
                                className="addAlbum-button"
                                disabled={selectedPhotoIds.length === 0}
                            >
                                Eliminar ({selectedPhotoIds.length})
                            </button>

                            <button 
                                onClick={toggleDeleteSelectionMode} 
                                className="addAlbum-button modalPhotos-no-button"
                            >
                                Cancelar
                            </button>
                        </div>
                        </>
                    )}
                    {isDeletePhotosConfirm && (
                        <>
                            <div className="modal-backdrop">
                                <div className="modal-content options-menu-popup">
                                    <h3>¿Seguro de eliminar?</h3>
                                    <div className="modal-buttons">
                                        <button onClick={deleteMultiplePhotos} className="modal-yes-button">Si</button>
                                        <button onClick={toggleDeletePhotosConfirm} className="modal-no-button">No</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {isMobileMenuOpen && (
                        <div className="menu-overlay" 
                            onClick={toggleMobileMenu}
                            >    
                        </div>
                    )}
                    <div 
                        className= {`menu-background ${isMobileMenuOpen ? 'menu-open' : ''}`}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <button onClick={ () => {
                            showAllAlbums();
                            toggleMobileMenu();
                        }} className="menu-button">Álbums</button>
                        <button onClick={ () => {
                            onOpenSettings();
                            handleInfoDetails();
                            toggleMobileMenu();
                        }} className="menu-button">Detalles</button>
                        <button onClick={ () => {
                            fileInputRef.current.click();
                            toggleMobileMenu();
                        }} className="menu-button">Añadir</button>
                        <button onClick={ () => {
                            setIsEditModePhotos(true);
                            toggleDeleteSelectionMode();
                            toggleMobileMenu();
                        }} className="menu-button">Eliminar</button>
                    </div>

                    <div className={`menu-button-delete ${isEditModePhotos ? 'menu-delete-open' : ''}`}>
                        <button 
                            onClick={toggleDeletePhotosConfirm} 
                            className="menu-button-delete-confirm"
                            disabled={selectedPhotoIds.length === 0}
                        >
                            Eliminar ({selectedPhotoIds.length})
                        </button>
                        <button 
                            onClick={ () => {
                                setIsEditModePhotos(false);
                                toggleDeleteSelectionMode();
                            }} 
                            className="menu-button-delete-confirm"
                        >
                            Cancelar
                        </button>
                        <button className="menu-button-delete-confirm hidden-but-retains-space">none</button>
                    </div>
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
    const handleContentClick = (e) => {
        // 🛑 CRUCIAL: Detiene la propagación del evento clic.
        // Esto evita que al hacer clic dentro del modal-content se active el onCancel del backdrop.
        e.stopPropagation();
    };
   

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-content" onClick={handleContentClick}>
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
    const handleContentClick = (e) => {
        // 🛑 CRUCIAL: Detiene la propagación del evento clic.
        e.stopPropagation();
    };
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content options-menu-popup" onClick={handleContentClick}>
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