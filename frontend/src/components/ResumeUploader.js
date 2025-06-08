import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ResumeUploader = ({ onResumeUpload }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'application/json') {
      toast.error('Please upload a PDF or JSON file');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(`http://${window.location.hostname}:8000/api/uploadResume`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onResumeUpload(data);
      toast.success('Resume uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload resume');
      console.error('Upload error:', error);
    }
  }, [onResumeUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        
        <DocumentArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        
        <p className="text-gray-600 mb-2">
          {isDragActive
            ? 'Drop your resume here'
            : 'Drag and drop your resume here, or click to select'}
        </p>
        
        <p className="text-sm text-gray-500">
          Supported formats: PDF, JSON
        </p>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>• Upload your resume to provide context for the AI</p>
        <p>• The system will parse your experience and skills</p>
        <p>• This helps generate more relevant interview responses</p>
      </div>
    </div>
  );
};

export default ResumeUploader; 