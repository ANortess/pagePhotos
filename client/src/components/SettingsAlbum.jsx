import React, {useState} from 'react';
import './MainAlbums.css';
import './OptionsContent.css';

function SettingsAlbum({ album, mode, onInfo, onEdit, onCover, onClose, onUpdate, onDeleteAlbum, onDeletePhoto, OnShowAllAlbums, onAlbumDeleted, onSetCover, onViewPhoto, onFunctionDeletePhoto}){
    const [editTitle, setEditTitle] = useState(album.title);
    const [editDescription, setEditDescription] = useState(album.description || '');

    const [showEditError, setShowEditError] = useState(false);
    const editErrorMessage = 'Este campo es obligatorio';

    const dateString = album.created_at;
    const isoDateString = dateString ? String(dateString).replace(' ', 'T') : '';
    const dateObject = new Date(isoDateString);
    const isValidDate = !isNaN(dateObject.getTime()); // Uso .getTime() para una comprobación más robusta
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pagephotos-production-up.railway.app' /*'http://localhost:3001'*/;

    const formattedDate = isValidDate 
        ? dateObject.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : 'Fecha desconocida';
        
    const emptyAlbumMessage = () => {
        setShowEditError(true);
            
        setTimeout(() => {
            setShowEditError(false);
        }, 3000); 
    }
    // 2. Lógica para el título del modal
    let modalTitle = album.title;
    switch (mode){
        case "_info":
            modalTitle = album.title;
            break;
        case "_edit":
            modalTitle = "Editando álbum";
            break;
        case "_deleteAlbum":
            modalTitle = album.title;
            break;
        case "_cover":
            modalTitle = "Tú Portada";
            break;
        case "_viewPhoto":
            modalTitle = "";
            break;
        default:
            modalTitle = album.title;
            break;
    }

    const handleSaveEdit = async () => {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            alert("No hay token para autenticar la edición.");
            return;
        }

        if (!editTitle.trim()) {
            emptyAlbumMessage(); 
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/albums/${album.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDescription,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // 1. Llama a la función del padre para actualizar la lista de álbumes en el estado
                onUpdate({ id: album.id, title: editTitle, description: editDescription });
                
                // 2. Vuelve al modo 'info' o 'view' después de guardar
                onInfo(); // Si onHall es el botón 'Volver' y restablece el modo.
                
            } else {
                console.error('Error al guardar:', data.message);
                alert(`Error al actualizar el álbum: ${data.message}`);
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('Error de red al intentar actualizar el álbum.');
        }
    };

    const handleConfirmDelete = async () => {
        const token = localStorage.getItem('authToken');
        const albumIdToDelete = album.id;

        const photosCount = await getPhotosCount(albumIdToDelete, token); 

        if (!token) {
            alert("No hay token para autenticar la eliminación.");
            return;
        }

        if (photosCount > 0) {
            // Si hay fotos, llama a la función de advertencia (que ya tienes)
            emptyAlbumMessage(photosCount); 
            return; // Detiene la ejecución para no borrar el álbum
        }

        try {
            const response = await fetch(`${API_BASE_URL}/albums/${albumIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`, 
                },
            });

            if (response.ok) {
                onAlbumDeleted(albumIdToDelete); 
                onClose(); 
                OnShowAllAlbums(); 
            } else {
                const errorData = await response.json();
                console.error('Error al borrar álbum:', errorData);
                alert(`Error al intentar borrar el álbum: ${errorData.message || response.statusText}`);
            }

        } catch (error) {
            console.error('Error de red al borrar álbum:', error);
            alert('Error de red al intentar borrar el álbum.');
        }
    };

    const getPhotosCount = async (albumId, token) => {
        
        try {
            const response = await fetch(`${API_BASE_URL}/albums/${albumId}/photos`, {
                headers: {
                    'Authorization': `Bearer ${token}`, 
                },
            });
            
            if (!response.ok) {
                console.error("No se pudieron cargar las fotos para la comprobación.");
                return -1; // Retorna un valor que indique error, para detener la eliminación
            }
            
            const photos = await response.json();
            return photos.length;

        } catch (error) {
            console.error("Error de red al contar fotos:", error);
            return -1; 
        }
    };

    const handleDeletePhotoClick = () => {
        if (onViewPhoto && onViewPhoto.id) {
            onFunctionDeletePhoto(onViewPhoto.id, album.id);
            onClose();
        } else {
            alert("No se encontró el ID de la foto para eliminar.");
        }
    }

    const handleSetCover = () => {
        onClose();
        onSetCover();
    }
    
    const content = (
        <>
            {mode === '_edit' && (
                <div className="edit-form-content">
                    <div className="addAlbum-form">
                        <span className="albumTitle">Título</span>

                        {showEditError && (
                            <span className='form-note'>
                                {editErrorMessage}
                            </span>
                        )}
                        
                        {/* Aquí usarías un estado local para el input si estuviera en un modal separado */}
                        <input 
                            type="text" 
                            defaultValue={album.title}
                            onChange={(e) => setEditTitle(e.target.value)} 
                            placeholder="Título"
                        />
                    </div>
                    <div className="addAlbum-form">
                        <span className="albumTitle">Descripción</span>
                        <textarea 
                            defaultValue={album.description} 
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Descripción"
                            rows="3"
                        />
                    </div>

                    <div className="modal-buttons">
                        <button onClick={handleSaveEdit} className="modal-yes-button">Guardar</button>
                        <button onClick={onInfo} className="modal-no-button">Volver</button>
                    </div>
                </div>
            )}

            {mode === '_info' && (
                <>
                    <p className="album-description">{album.description || "No hay descripción."}</p>

                    <div className="modal-buttons">
                        <button onClick={onEdit} className="modal-yes-button">Editar</button>
                        <button onClick={onCover} className="modal-yes-button">Portada</button>
                        <button onClick={onDeleteAlbum} className="modal-yes-button">Eliminar</button>
                    </div>
                    <div className="modal-buttons">
                        <button onClick={onClose} className="modal-no-button">Volver</button>
                    </div>
                </>
            )}


            {mode == '_cover' && (
                <>
                    <div className='modal-cover-show'>
                        <img 
                            src={album.cover_photo_url} 
                            alt="Portada" 
                        />
                    </div>

                    <div className="modal-buttons">
                        <button onClick={handleSetCover} className="modal-yes-button">Cambiar</button>
                        <button onClick={onInfo} className="modal-no-button">Volver</button>
                    </div>
                </>
            )}

            
            {mode === '_deleteAlbum' && (
                <>
                    <p>Desde el {formattedDate}</p>
                    <p>¿Quieres realmente eliminar este álbum?</p>
                    {showEditError && (
                        <span className='form-note'>
                            Vacia el álbum antes de eliminarlo
                        </span>
                    )}
                    <div className="modal-buttons">
                        <button onClick={handleConfirmDelete} className="modal-yes-button">Si</button>
                        <button onClick={onInfo} className="modal-no-button">No</button>
                    </div>
                </>
            )}

            {mode === '_viewPhoto' && onViewPhoto && (
                <div>
                    <div className='modal-viewPhoto'>
                        <img 
                            src={onViewPhoto.url} 
                            alt={`ViewPhoto ${onViewPhoto.id || ''}`} 
                        />
                    </div>
                    <div className="modal-buttons">
                        <button onClick={onDeletePhoto} className="modal-yes-button">Eliminar</button>
                        <button onClick={onClose} className="modal-no-button">Volver</button>
                    </div>
                </div>
            )}

            {mode === '_deletePhoto' && (
                <div>
                    <p>¿Quieres realmente eliminar esta foto?</p>
                    <div className="modal-buttons">
                        <button onClick={handleDeletePhotoClick} className="modal-yes-button">Eliminar</button>
                        <button onClick={onClose} className="modal-no-button">Volver</button>
                    </div>
                </div>
            )}
        </>
    );

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
            onInfo();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{modalTitle}</h3> {/* <-- Título dinámico */}
                {content} {/* <-- Contenido dinámico */}
            </div>
        </div>
    );
}


export default SettingsAlbum; 