import { Link } from 'react-router-dom';
import { Smartphone, ArrowLeft } from 'lucide-react';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FFF8F0] px-4 py-2 rounded-full border border-[#A8C9B8] mb-4">
            <Smartphone className="w-4 h-4 text-[#035035]" />
            <span className="text-sm font-medium text-[#035035]">Mobile App</span>
          </div>
          <h1 className="text-5xl font-bold text-[#035035] mb-6">Download Piatto</h1>
        </div>

        {/* Coming Soon Message */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[#FFF8F0] to-white rounded-3xl shadow-lg border border-[#F5F5F5] p-12 text-center">
            <div className="w-20 h-20 bg-[#035035] rounded-full flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#035035] mb-4">
              Mobile App is Currently Under Development
            </h2>
            <p className="text-xl text-[#2D2D2D] mb-8 opacity-80">
              Coming Soon
            </p>
            <p className="text-base text-[#2D2D2D] mb-10 opacity-70">
              We're working hard to bring you an amazing mobile experience. Stay tuned for updates!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#035035] text-white px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
