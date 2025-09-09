import { useState } from 'react';
import ImageUpload from './ImageUpload';

const TestUpload = () => {
  const [uploadedFile, setUploadedFile] = useState('');
  const [hotelName, setHotelName] = useState('Hotel Exemplo');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Teste de Upload AWS S3</h2>
      
      {/* Input para nome do hotel */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">
          Nome do Hotel (para organizar pastas)
        </label>
        <input
          type="text"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
          placeholder="Ex: Hotel Marriott"
        />
        <p className="text-sm text-white/60 mt-1">
          Deixe vazio para salvar na pasta 'app' (arquivos gerais)
        </p>
      </div>

      {/* Componente de upload */}
      <ImageUpload
        label="Upload de Imagem ou PDF"
        value={uploadedFile}
        onChange={(url) => {
          setUploadedFile(url);
          console.log('Arquivo enviado para:', url);
        }}
        hotelName={hotelName || null}
        acceptFiles="image/*,application/pdf"
      />

      {/* Resultado */}
      {uploadedFile && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h3 className="text-green-400 font-medium mb-2">✅ Upload Concluído!</h3>
          <p className="text-white text-sm break-all">
            URL: {uploadedFile}
          </p>
          {uploadedFile.includes('hoteloshia.s3') && (
            <p className="text-green-300 text-xs mt-1">
              📁 Pasta: {hotelName ? hotelName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'app'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TestUpload;