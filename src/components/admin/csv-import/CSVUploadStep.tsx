'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Eye, Download, FileText } from 'lucide-react'
import type { Translations } from '@/lib/i18n'

interface CSVUploadStepProps {
  file: File | null
  isLoading: boolean
  error: string
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onPreview: () => void
  t: Translations
}

export function CSVUploadStep({ 
  file, 
  isLoading, 
  error, 
  onFileSelect, 
  onPreview,
  t 
}: CSVUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const template = [
      'name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password',
      'John Doe,john.doe@company.com,johndoe,employee,Engineering,office,EMP001,PID001,PID002,EMP002,Software Engineer,Day,Password123!',
      'Jane Smith,jane.smith@company.com,janesmith,manager,Engineering,office,EMP002,PID002,,,Engineering Manager,Day,Password123!',
      'Bob Worker,,bobworker,employee,Production,operational,EMP003,PID003,PID002,EMP002,Line Worker,Morning,1234'
    ].join('\n')
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'csv-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
          <Upload className="h-4 w-4" />
          {t.users.step} 1: {t.users.uploadCSVFile}
        </CardTitle>
        <CardDescription className="text-gray-700 text-sm">
          {t.users.selectCSVFileDescription || 'Select a CSV file containing user data to import. Use our template for the correct format.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 mb-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
          >
            <Download className="h-3 w-3" />
            {t.users.downloadTemplate}
          </button>
          <button
            onClick={() => window.open('/docs/csv-import-guide.pdf', '_blank')}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
          >
            <FileText className="h-3 w-3" />
            {t.users.importGuide}
          </button>
        </div>

        <div 
          className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-6 w-6 text-gray-600 mb-2" />
          <p className="text-sm font-medium mb-1 text-gray-900">
            {file ? file.name : t.users.chooseFileOrDrag}
          </p>
          <p className="text-xs text-gray-700 mb-2">
            {file 
              ? `${(file.size / 1024).toFixed(1)} KB • ${t.users.clickToChangeFile}`
              : t.users.csvFilesUpTo
            }
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileSelect}
            className="hidden"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <button 
            onClick={onPreview}
            disabled={!file || isLoading}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600"
          >
            <Eye className="h-3 w-3" />
            {isLoading ? t.users.analyzing : t.users.previewImport}
          </button>
        </div>

        {/* Format requirements */}
        <div className="bg-gray-50 p-3 rounded text-xs">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">{t.users.csvRequirements}</h4>
          <div className="grid grid-cols-2 gap-2 text-gray-700">
            <div>• {t.users.requiredFields}</div>
            <div>• {t.users.officeUsers}</div>
            <div>• {t.users.operationalUsers}</div>
            <div>• {t.users.managers}</div>
            <div className="col-span-2">• {t.users.encoding}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}