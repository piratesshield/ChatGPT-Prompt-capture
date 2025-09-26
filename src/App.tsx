import React from 'react';
import { Download, MessageSquare, Settings, FileText } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/public/mmimage.png" 
              alt="GPT Robot" 
              className="w-24 h-24 rounded-2xl shadow-2xl"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            ChatGPT Prompt Capture
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Automatically capture and save your ChatGPT prompts as organized text files. 
            Never lose your creative conversations again.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <MessageSquare className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Auto Capture</h3>
            <p className="text-green-100 text-sm">
              Automatically saves every prompt you send to ChatGPT
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Download className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Easy Download</h3>
            <p className="text-green-100 text-sm">
              Download individual prompts or export all at once
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <FileText className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Organized Files</h3>
            <p className="text-green-100 text-sm">
              Timestamped files saved in organized folders
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Settings className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
            <p className="text-green-100 text-sm">
              All data stored locally, no external servers
            </p>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Quick Installation Guide
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <h3 className="font-semibold text-white mb-2">Download Extension</h3>
              <p className="text-green-100 text-sm">
                Download all extension files to a folder on your computer
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <h3 className="font-semibold text-white mb-2">Load in Chrome</h3>
              <p className="text-green-100 text-sm">
                Go to chrome://extensions/, enable Developer Mode, click "Load unpacked"
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <h3 className="font-semibold text-white mb-2">Start Capturing</h3>
              <p className="text-green-100 text-sm">
                Visit ChatGPT and start sending prompts - they'll be automatically saved!
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Ready to Never Lose a Prompt Again?
            </h2>
            <p className="text-gray-600 mb-6">
              Install the extension and start building your personal prompt library today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Download Extension Files
              </button>
              <button className="border-2 border-green-500 text-green-500 hover:bg-green-50 px-8 py-3 rounded-lg font-semibold transition-colors">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;