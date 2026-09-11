import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageCropper.css';

const ImageCropper = ({ image, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({
        unit: '%',
        width: 90,
        height: 90,
        x: 5,
        y: 5,
        aspect: 1
    });
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const previewCanvasRef = useRef(null);

    const onLoad = (img) => {
        imgRef.current = img;
    };

    useEffect(() => {
        if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return;

        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        const crop = completedCrop;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');

        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );
    }, [completedCrop]);

    const handleCropComplete = () => {
        if (!completedCrop || !previewCanvasRef.current) return;

        previewCanvasRef.current.toBlob(
            (blob) => {
                if (!blob) {
                    console.error('Failed to create blob');
                    return;
                }
                onCropComplete(blob);
            },
            'image/jpeg',
            0.95
        );
    };

    return (
        <div className="cropper-modal">
            <div className="cropper-content">
                <h2>Crop Profile Picture</h2>
                <div className="cropper-container">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                    >
                        <img
                            ref={imgRef}
                            src={image}
                            alt="Crop me"
                            onLoad={(e) => onLoad(e.target)}
                            style={{ maxHeight: '70vh' }}
                        />
                    </ReactCrop>
                    <canvas
                        ref={previewCanvasRef}
                        style={{ display: 'none' }}
                    />
                </div>
                <div className="cropper-buttons">
                    <button onClick={onCancel} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleCropComplete} className="btn-primary">
                        Crop & Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper; 