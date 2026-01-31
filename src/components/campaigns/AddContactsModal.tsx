import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Database, FileSpreadsheet, User, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// CORRECCIÓN: Usar nombres en inglés para coincidir con el DTO del Backend
interface Contact {
  identification: string;
  name: string;    // Antes 'nombre'
  phone: string;   // Antes 'telefono'
  message: string; // Antes 'mensaje'
}

interface AddContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contacts: Contact[]) => Promise<void>;
  defaultMessage?: string;
}

interface PadreNivel {
  id_padre: number;
  nombre_padre: string;
  niveles: {
    id_nivel: number;
    nombre_nivel: string;
  }[];
}

interface ExcelColumn {
  name: string;
  index: number;
}

export default function AddContactsModal({
  isOpen,
  onClose,
  onAdd,
  defaultMessage = '',
}: Readonly<AddContactsModalProps>) {
  const [mode, setMode] = useState<'manual' | 'database' | 'excel'>('excel');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Excel mapping states
  const [excelColumns, setExcelColumns] = useState<ExcelColumn[]>([]);
  const [excelData, setExcelData] = useState<string[][]>([]);
  
  // Estado para guardar qué columna corresponde a qué dato
  const [columnMapping, setColumnMapping] = useState({
    telefono: '',
    nombre: '',
    identificacion: '',
  });
  
  // Estado para la plantilla del mensaje
  const [messageTemplate, setMessageTemplate] = useState('');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const [showMapping, setShowMapping] = useState(false);

  // Database states
  const [padresNiveles, setPadresNiveles] = useState<PadreNivel[]>([]);
  const [selectedPadre, setSelectedPadre] = useState<number | null>(null);
  const [selectedNivel, setSelectedNivel] = useState<number | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    if (isOpen && mode === 'database') {
      loadPadresNiveles();
    }
    if (isOpen && defaultMessage && !messageTemplate) {
        setMessageTemplate(defaultMessage);
    }
  }, [isOpen, mode, defaultMessage]);

  const loadPadresNiveles = async () => {
    setLoadingDb(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/contactos/padres-niveles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPadresNiveles(response.data);
    } catch (err: any) {
      toast.error('Error cargando carteras: ' + err.message);
    } finally {
      setLoadingDb(false);
    }
  };

  const loadContactsFromDb = async () => {
    if (!selectedPadre || !selectedNivel) {
      toast.error('Selecciona una cartera y un nivel');
      return;
    }

    setLoadingDb(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/contactos/contactosnivel`, 
        { id_padre: selectedPadre, id_nivel: selectedNivel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;
      
      // CORRECCIÓN: Mapear la respuesta de la DB a las propiedades en inglés
      const formattedContacts: Contact[] = data.map((c: any) => ({
        identification: c.identificacion || '',
        name: c.nombre || '',
        phone: c.telefono || '',
        message: defaultMessage,
      }));

      setContacts(formattedContacts);
      toast.success(`${formattedContacts.length} contactos cargados desde la base de datos`);
    } catch (err: any) {
      toast.error('Error cargando contactos: ' + err.message);
    } finally {
      setLoadingDb(false);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('El archivo Excel no contiene hojas válidas');
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('La hoja de Excel está vacía');
      }

      const headers = jsonData[0];
      const columns: ExcelColumn[] = headers.map((name, index) => ({
        name: String(name || `Columna ${index + 1}`),
        index
      }));

      const dataRows = jsonData.slice(1).filter(row => 
        Array.isArray(row) && row.some(cell => cell !== null && cell !== '')
      );

      const stringRows = dataRows.map(row => 
        row.map(cell => cell !== null && cell !== undefined ? String(cell).trim() : '')
      );

      setExcelColumns(columns);
      setExcelData(stringRows);
      setShowMapping(true);
      
      const autoMapping: any = {
        telefono: '',
        nombre: '',
        identificacion: '',
      };

      columns.forEach(col => {
        const nameLower = col.name.toLowerCase();
        if (nameLower.includes('telefono') || nameLower.includes('teléfono') || nameLower.includes('celular') || nameLower.includes('phone')) {
          autoMapping.telefono = col.name;
        } else if (nameLower.includes('nombre') || nameLower.includes('name')) {
          autoMapping.nombre = col.name;
        } else if (nameLower.includes('identificacion') || nameLower.includes('identificación') || nameLower.includes('cedula') || nameLower.includes('cédula') || nameLower.includes('id')) {
          autoMapping.identificacion = col.name;
        }
      });

      setColumnMapping(autoMapping);
      toast.success(`Archivo cargado: ${stringRows.length} registros encontrados`);
      
    } catch (error: any) {
      throw new Error(`Error procesando archivo Excel: ${error.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    setLoading(true);
    setError(null);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        await processExcelFile(file);
      } else if (fileExtension === 'csv') {
        const text = await file.text();
        const rows = text
          .split('\n')
          .map(line => line.split(',').map(cell => cell.trim()))
          .filter(Boolean);
        
        if (rows.length === 0) {
          throw new Error('El archivo está vacío');
        }

        const headers = rows[0];
        const columns: ExcelColumn[] = headers.map((name, index) => ({
          name: name || `Columna ${index + 1}`,
          index
        }));

        setExcelColumns(columns);
        setExcelData(rows.slice(1));
        setShowMapping(true);
        toast.success(`Archivo CSV cargado: ${rows.length - 1} registros`);
      } else {
        throw new Error('Formato de archivo no soportado. Use .csv, .xlsx o .xls');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      setShowMapping(false);
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    const textarea = messageInputRef.current;
    
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = 
            messageTemplate.substring(0, start) + 
            variable + 
            messageTemplate.substring(end);
        
        setMessageTemplate(newValue);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    } else {
        setMessageTemplate(prev => prev + variable);
    }
  };

  const handleProcessMapping = () => {
    if (!columnMapping.telefono) {
      toast.error('Debes seleccionar al menos la columna de teléfono');
      return;
    }

    try {
      const telefonoIndex = excelColumns.find(c => c.name === columnMapping.telefono)?.index;
      const nombreIndex = excelColumns.find(c => c.name === columnMapping.nombre)?.index;
      const identificacionIndex = excelColumns.find(c => c.name === columnMapping.identificacion)?.index;
      
      if (telefonoIndex === undefined) {
        throw new Error('Columna de teléfono no encontrada');
      }

      const parsedContacts: Contact[] = excelData.map((row, index) => {
        const telefono = row[telefonoIndex] || '';
        
        if (!telefono) {
          console.warn(`Fila ${index + 2}: teléfono vacío, se omitirá`);
          return null;
        }

        let finalMessage = messageTemplate;
        if (finalMessage) {
            finalMessage = finalMessage.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
                const colName = p1.trim();
                const col = excelColumns.find(c => c.name === colName);
                if (col && row[col.index] !== undefined) {
                    return row[col.index]; 
                }
                return match; 
            });
        } else {
            finalMessage = defaultMessage;
        }

        // CORRECCIÓN: Generar objeto con claves en inglés (name, phone, etc.)
        return {
          identification: identificacionIndex !== undefined ? (row[identificacionIndex] || '') : '',
          name: nombreIndex !== undefined ? (row[nombreIndex] || '') : '',
          phone: telefono,
          message: finalMessage,
        };
      }).filter((c): c is Contact => c !== null);

      setContacts(parsedContacts);
      setShowMapping(false);
      toast.success(`${parsedContacts.length} contactos procesados correctamente`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleManualParse = () => {
    if (!manualInput.trim()) {
      toast.error('Ingresa datos para procesar');
      return;
    }

    try {
      const lines = manualInput.trim().split('\n');
      const parsedContacts = lines.map((line, index) => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 3) {
          throw new Error(`Línea ${index + 1}: debe tener al menos 3 columnas`);
        }
        // CORRECCIÓN: Generar objeto con claves en inglés
        return {
          identification: parts[0],
          name: parts[1],
          phone: parts[2],
          message: parts[3] || defaultMessage,
        };
      });

      setContacts(parsedContacts);
      toast.success(`${parsedContacts.length} contactos procesados`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async () => {
    if (contacts.length === 0) {
      toast.error('No hay contactos para agregar');
      return;
    }
    
    await onAdd(contacts);
    
    setContacts([]);
    setManualInput('');
    setUploadedFile(null);
    setShowMapping(false);
    setExcelColumns([]);
    setExcelData([]);
    setColumnMapping({ telefono: '', nombre: '', identificacion: '' });
    setMessageTemplate(''); 
    
    onClose();
  };

  if (!isOpen) return null;

  const selectedPadreData = padresNiveles.find(p => p.id_padre === selectedPadre);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Contactos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Importe contactos desde un archivo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setMode('manual')}
              className={`p-4 border-2 rounded-lg transition-all ${
                mode === 'manual'
                  ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-6 h-6 mx-auto mb-2 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Ingreso Manual
              </h3>
            </button>

            <button
              onClick={() => setMode('excel')}
              className={`p-4 border-2 rounded-lg transition-all ${
                mode === 'excel'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <FileSpreadsheet className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Importar Excel
              </h3>
            </button>

            <button
              onClick={() => setMode('database')}
              className={`p-4 border-2 rounded-lg transition-all ${
                mode === 'database'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <Database className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Finsolred
              </h3>
            </button>
          </div>

          {mode === 'excel' && !showMapping && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Arrastra o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  .xlsx .xls .csv
                </p>
                <input
                  id="file-upload-excel"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload-excel"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                >
                  Seleccionar archivo
                </label>
              </div>

              {uploadedFile && !showMapping && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {((uploadedFile.size / 1024).toFixed(2))} KB
                    </p>
                  </div>
                  <span className="text-green-600 font-semibold">
                    {excelData.length} registros
                  </span>
                </div>
              )}
            </div>
          )}

          {mode === 'excel' && showMapping && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      {uploadedFile?.name}
                    </p>
                  </div>
                </div>
                <span className="text-green-600 font-semibold">
                  {excelData.length} registros
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Columna teléfono <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.telefono}
                    onChange={(e) => setColumnMapping({ ...columnMapping, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione</option>
                    {excelColumns.map((col) => (
                      <option key={col.index} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Columna nombre (opcional)
                  </label>
                  <select
                    value={columnMapping.nombre}
                    onChange={(e) => setColumnMapping({ ...columnMapping, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione</option>
                    {excelColumns.map((col) => (
                      <option key={col.index} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Columna identificación (opcional)
                  </label>
                  <select
                    value={columnMapping.identificacion}
                    onChange={(e) => setColumnMapping({ ...columnMapping, identificacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione</option>
                    {excelColumns.map((col) => (
                      <option key={col.index} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Plantilla del Mensaje
                </label>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Haga clic para insertar variable:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {excelColumns.map((col) => (
                      <button
                        key={col.index}
                        onClick={() => insertVariable(col.name)}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium hover:opacity-80 transition-opacity flex items-center"
                        type="button"
                      >
                        <Plus className="w-3 h-3 mr-1"/> {col.name}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  ref={messageInputRef}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Hola {{Nombre}}, le escribimos por su deuda de {{Monto}}..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Use las variables de arriba para personalizar el mensaje por cada contacto.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowMapping(false);
                    setUploadedFile(null);
                    setExcelColumns([]);
                    setExcelData([]);
                    setMessageTemplate('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessMapping}
                  disabled={!columnMapping.telefono}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Procesar Contactos
                </button>
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="manual-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pegar datos manualmente
                </label>
                <textarea
                  id="manual-input"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={`identificacion,nombre,telefono,mensaje\n1234567890,Juan Pérez,0991234567,Hola Juan...\n0987654321,María García,0987654321,Hola María...`}
                  className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600
                    rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={handleManualParse}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Procesar Datos
                </button>
              </div>
            </div>
          )}

          {mode === 'database' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="select-padre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seleccionar Cartera
                </label>
                <select
                  id="select-padre"
                  value={selectedPadre || ''}
                  onChange={(e) => {
                    setSelectedPadre(Number(e.target.value));
                    setSelectedNivel(null);
                  }}
                  disabled={loadingDb}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Seleccionar --</option>
                  {padresNiveles.map((padre) => (
                    <option key={padre.id_padre} value={padre.id_padre}>
                      {padre.nombre_padre}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPadre && selectedPadreData && (
                <div>
                  <label htmlFor="select-nivel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar Nivel
                  </label>
                  <select
                    id="select-nivel"
                    value={selectedNivel || ''}
                    onChange={(e) => setSelectedNivel(Number(e.target.value))}
                    disabled={loadingDb}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Seleccionar --</option>
                    {selectedPadreData.niveles.map((nivel) => (
                      <option key={nivel.id_nivel} value={nivel.id_nivel}>
                        {nivel.nombre_nivel}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={loadContactsFromDb}
                disabled={!selectedPadre || !selectedNivel || loadingDb}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingDb ? 'Cargando...' : 'Cargar Contactos'}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                ❌ {error}
              </p>
            </div>
          )}

          {contacts.length > 0 && !showMapping && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">
                ✅ {contacts.length} contactos listos para agregar
              </p>
              <div className="max-h-40 overflow-y-auto">
                {contacts.slice(0, 5).map((contact, index) => (
                  <div key={`${contact.identification}-${index}`} className="text-xs text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-1 mb-1">
                    <p><span className="font-semibold">{contact.phone}</span> - {contact.name}</p>
                    <p className="text-gray-500 truncate italic">"{contact.message}"</p>
                  </div>
                ))}
                {contacts.length > 5 && (
                  <p className="text-xs text-gray-500 mt-1">
                    ... y {contacts.length - 5} más
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {!showMapping && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={contacts.length === 0 || loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar Contactos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}