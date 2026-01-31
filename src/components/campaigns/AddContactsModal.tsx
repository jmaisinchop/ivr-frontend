import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileSpreadsheet, User, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Contact {
  identification: string;
  name: string;
  phone: string;
  message: string;
}

interface AddContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contacts: Contact[]) => Promise<void>;
  defaultMessage?: string;
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
  // Solo permitimos manual o excel
  const [mode, setMode] = useState<'manual' | 'excel'>('excel');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [excelColumns, setExcelColumns] = useState<ExcelColumn[]>([]);
  const [excelData, setExcelData] = useState<string[][]>([]);

  const [columnMapping, setColumnMapping] = useState({
    telefono: '',
    nombre: '',
    identificacion: '',
  });

  const [messageTemplate, setMessageTemplate] = useState('');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const [showMapping, setShowMapping] = useState(false);

  useEffect(() => {
    if (isOpen && defaultMessage && !messageTemplate) {
      setMessageTemplate(defaultMessage);
    }
  }, [isOpen, defaultMessage, messageTemplate]);

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/20">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Gestión de Contactos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Importe contactos desde un archivo Excel/CSV o manualmente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setMode('manual')}
              className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center ${
                mode === 'manual'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50'
              }`}
            >
              <User className={`w-6 h-6 mb-2 ${mode === 'manual' ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="font-semibold text-sm">Ingreso Manual</h3>
            </button>

            <button
              onClick={() => setMode('excel')}
              className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center ${
                mode === 'excel'
                  ? 'border-green-500 bg-green-500/5 text-green-600 dark:text-green-400'
                  : 'border-border bg-card text-muted-foreground hover:border-green-500/50'
              }`}
            >
              <FileSpreadsheet className={`w-6 h-6 mb-2 ${mode === 'excel' ? 'text-green-500' : 'text-muted-foreground'}`} />
              <h3 className="font-semibold text-sm">Importar Excel</h3>
            </button>
          </div>

          {/* Mode: Excel */}
          {mode === 'excel' && !showMapping && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:bg-secondary/5 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-foreground font-medium mb-2">
                  Arrastra o haz clic para seleccionar
                </p>
                <p className="text-sm text-muted-foreground mb-6">
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
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 cursor-pointer font-medium transition-colors"
                >
                  Seleccionar archivo
                </label>
              </div>

              {uploadedFile && !showMapping && (
                <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {((uploadedFile.size / 1024).toFixed(2))} KB
                    </p>
                  </div>
                  <span className="text-green-700 dark:text-green-300 font-semibold text-sm">
                    {excelData.length} filas
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mode: Mapping */}
          {mode === 'excel' && showMapping && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2">
              <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    {uploadedFile?.name}
                  </p>
                </div>
                <span className="text-green-700 dark:text-green-300 font-bold text-sm">
                  {excelData.length} registros
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Columna Teléfono <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={columnMapping.telefono}
                    onChange={(e) => setColumnMapping({ ...columnMapping, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Seleccione</option>
                    {excelColumns.map((col) => (
                      <option key={col.index} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Columna Nombre (opcional)
                  </label>
                  <select
                    value={columnMapping.nombre}
                    onChange={(e) => setColumnMapping({ ...columnMapping, nombre: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Seleccione</option>
                    {excelColumns.map((col) => (
                      <option key={col.index} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Columna ID (opcional)
                  </label>
                  <select
                    value={columnMapping.identificacion}
                    onChange={(e) => setColumnMapping({ ...columnMapping, identificacion: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Seleccione</option>
                    {excelColumns.map((col) => (
                      <option key={col.index} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <label className="block text-sm font-bold text-foreground mb-3">
                  Plantilla del Mensaje (Variables)
                </label>

                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Clic para insertar variable de su Excel:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {excelColumns.map((col) => (
                      <button
                        key={col.index}
                        onClick={() => insertVariable(col.name)}
                        type="button"
                        className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 flex items-center transition-colors"
                      >
                        <Plus className="w-3 h-3 mr-1" /> {col.name}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  ref={messageInputRef}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Hola {{Nombre}}, le escribimos por su deuda de {{Monto}}..."
                  className="w-full h-32 px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:outline-none font-mono text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  El mensaje se generará dinámicamente para cada fila del Excel.
                </p>
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
                  className="px-4 py-2 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessMapping}
                  disabled={!columnMapping.telefono}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Procesar Contactos
                </button>
              </div>
            </div>
          )}

          {/* Mode: Manual */}
          {mode === 'manual' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label htmlFor="manual-input" className="block text-sm font-medium text-foreground mb-2">
                  Pegar datos (CSV)
                </label>
                <div className="bg-secondary/20 p-3 rounded-lg mb-2 text-xs text-muted-foreground font-mono">
                  Formato: identificacion, nombre, telefono, mensaje
                </div>
                <textarea
                  id="manual-input"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={`1234567890,Juan Pérez,0991234567,Hola Juan...\n0987654321,María García,0987654321,Hola María...`}
                  className="w-full h-64 px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:outline-none font-mono text-sm"
                />
                <button
                  onClick={handleManualParse}
                  className="mt-4 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium transition-all"
                >
                  Procesar Datos
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive font-medium flex items-center">
                <X className="w-4 h-4 mr-2" /> {error}
              </p>
            </div>
          )}

          {contacts.length > 0 && !showMapping && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl animate-in slide-in-from-bottom-2">
              <p className="text-sm text-green-700 dark:text-green-300 font-bold mb-3 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {contacts.length} contactos listos para importar
              </p>
              <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {contacts.slice(0, 10).map((contact, index) => (
                  <div key={`${contact.identification}-${index}`} className="text-xs bg-background/50 p-2 rounded-lg border border-green-100 dark:border-green-900/30">
                    <div className="flex justify-between font-medium text-foreground">
                      <span>{contact.phone}</span>
                      <span>{contact.name}</span>
                    </div>
                    <p className="text-muted-foreground truncate italic mt-1">"{contact.message}"</p>
                  </div>
                ))}
                {contacts.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    ... y {contacts.length - 10} más
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showMapping && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50 bg-secondary/10">
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={contacts.length === 0 || loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Confirmar e Importar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}