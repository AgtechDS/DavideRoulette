import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUp, FileSpreadsheet, CheckCircle2, AlertCircle, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AIAnalysisCSVUploader() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  
  // Upload and process CSV mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulate progress for demo
      setUploading(true);
      setUploadProgress(0);
      
      const simulateProgress = () => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(timer);
            return prev;
          }
          return prev + 5;
        });
      };
      
      const timer = setInterval(simulateProgress, 200);
      
      try {
        // In una vera implementazione, questa sarebbe una chiamata API reale
        // const response = await apiRequest('POST', '/api/ai/dataset/upload', formData);
        
        // Per la demo, simuliamo la chiamata API
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        clearInterval(timer);
        setUploadProgress(100);
        setProcessed(true);
        
        return { success: true };
      } catch (error) {
        clearInterval(timer);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Dataset importato con successo",
        description: "I dati CSV sono stati elaborati e sono ora disponibili per l'analisi AI.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/insights"] });
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Errore durante l'importazione",
        description: error.message || "Non è stato possibile elaborare il file CSV.",
        variant: "destructive"
      });
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Verifica estensione file
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Formato file non supportato",
          description: "Per favore seleziona un file CSV.",
          variant: "destructive"
        });
        return;
      }
      
      // Verifica dimensione file (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File troppo grande",
          description: "Il file deve essere inferiore a 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      setProcessed(false);
    }
  };
  
  const handleUpload = () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('replaceExisting', String(replaceExisting));
    
    uploadMutation.mutate(formData);
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const resetUpload = () => {
    setFile(null);
    setUploadProgress(0);
    setProcessed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          Importazione Dataset CSV
        </CardTitle>
        <CardDescription>
          Importa un dataset di risultati passati per migliorare l'analisi AI
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          style={{ display: 'none' }}
        />
        
        {!file ? (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
            onClick={handleButtonClick}
          >
            <FileUp className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-1">
              Clicca per selezionare un file CSV
            </p>
            <p className="text-xs text-gray-500">
              Supporta fino a 10MB, formato CSV con intestazioni
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet className="h-6 w-6 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              
              {processed ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetUpload}
                  disabled={uploading}
                >
                  Cambia
                </Button>
              )}
            </div>
            
            {uploading && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
              </div>
            )}
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="replaceExisting" 
                checked={replaceExisting} 
                onCheckedChange={(checked) => setReplaceExisting(checked === true)}
                disabled={uploading || processed}
              />
              <label 
                htmlFor="replaceExisting" 
                className="text-sm text-gray-600 cursor-pointer"
              >
                Sostituisci dati esistenti
              </label>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <div className="text-xs text-gray-500">
          {processed ? (
            <span className="flex items-center text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Elaborazione completata
            </span>
          ) : file ? (
            <span className="flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Minimo 100.000 righe raccomandate
            </span>
          ) : (
            <span>Formato: numero,colore,vincita,puntata</span>
          )}
        </div>
        
        <Button
          size="sm"
          onClick={handleUpload}
          disabled={!file || uploading || processed}
        >
          {uploading ? (
            <>
              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              Elaborazione...
            </>
          ) : (
            "Importa Dataset"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}