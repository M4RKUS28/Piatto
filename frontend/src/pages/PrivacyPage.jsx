import { Link } from 'react-router-dom';
import { Shield, Lock, Database, Globe, Mail, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next'

export default function PrivacyPage() {
  const lastUpdated = 'October 17, 2025';

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FFF8F0] px-4 py-2 rounded-full border border-[#A8C9B8] mb-4">
              <Shield className="w-4 h-4 text-[#035035]" />
              <span className="text-sm font-medium text-[#035035]">Privacy & Security</span>
            </div>
            <h1 className="text-5xl font-bold text-[#035035] mb-4">Privacy Policy</h1>
            <p className="text-lg text-[#2D2D2D]">Last updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-3xl shadow-lg border border-[#F5F5F5] p-8 md:p-12">
            {/* Introduction */}
            <section className="mb-10">
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                At Piatto, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you use our AI-powered cooking assistant application. 
                Please read this privacy policy carefully.
              </p>
              <p className="text-[#2D2D2D] leading-relaxed">
                By using Piatto, you agree to the collection and use of information in accordance with this policy. 
                If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-[#FF9B7B]" />
                <h2 className="text-2xl font-bold text-[#035035]">Information We Collect</h2>
              </div>
              
              <h3 className="text-lg font-semibold text-[#035035] mb-3 mt-6">Personal Information</h3>
              <p className="text-[#2D2D2D] leading-relaxed mb-3">
                When you register for an account, we collect:
              </p>
              <ul className="list-none space-y-2 mb-6">
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Email address</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Username</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Profile information (optional)</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Authentication credentials (encrypted)</span>
                </li>
              </ul>

              <h3 className="text-lg font-semibold text-[#035035] mb-3">Usage Data</h3>
              <p className="text-[#2D2D2D] leading-relaxed mb-3">
                We collect information about how you interact with our service:
              </p>
              <ul className="list-none space-y-2 mb-6">
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Recipe searches and cooking requests you make</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Images you upload for recipe analysis</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Saved recipes and preferences</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Device information and browser type</span>
                </li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#FF9B7B]" />
                <h2 className="text-2xl font-bold text-[#035035]">How We Use Your Information</h2>
              </div>
              
              <p className="text-[#2D2D2D] leading-relaxed mb-3">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-none space-y-2 mb-6">
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Service Delivery:</strong> To provide, maintain, and improve our AI-powered recipe suggestions and cooking assistance</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Personalization:</strong> To customize your experience and provide tailored recipe recommendations</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Communication:</strong> To send you updates, security alerts, and support messages</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Analytics:</strong> To understand how users interact with our service and improve functionality</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Security:</strong> To detect, prevent, and address technical issues and fraudulent activity</span>
                </li>
              </ul>

              <div className="bg-[#FFF8F0] border border-[#A8C9B8] rounded-2xl p-6 mt-6">
                <p className="text-sm text-[#035035] font-medium">
                  <strong>Important:</strong> We only process your data for the purposes necessary to provide our services. 
                  Your uploaded images and recipe requests are used solely for generating personalized cooking recommendations 
                  and are not shared with third parties for marketing purposes.
                </p>
              </div>
            </section>

            {/* Data Storage and Security */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-[#FF9B7B]" />
                <h2 className="text-2xl font-bold text-[#035035]">Data Storage and Security</h2>
              </div>
              
              <h3 className="text-lg font-semibold text-[#035035] mb-3">Server Location</h3>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                Our servers and data infrastructure are located in the <strong>United States</strong>. By using Piatto, 
                you consent to the transfer and processing of your data in the United States, regardless of your location.
              </p>

              <h3 className="text-lg font-semibold text-[#035035] mb-3">Security Measures</h3>
              <p className="text-[#2D2D2D] leading-relaxed mb-3">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-none space-y-2 mb-6">
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Encryption of data in transit (HTTPS/TLS)</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Secure password hashing and authentication</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Regular security audits and updates</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span>Access controls and monitoring</span>
                </li>
              </ul>

              <h3 className="text-lg font-semibold text-[#035035] mb-3">Data Retention</h3>
              <p className="text-[#2D2D2D] leading-relaxed">
                We retain your personal information only as long as necessary to provide our services and comply with legal obligations. 
                You can request deletion of your account and associated data at any time by contacting us.
              </p>
            </section>

            {/* International Users */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-[#FF9B7B]" />
                <h2 className="text-2xl font-bold text-[#035035]">International Users</h2>
              </div>
              
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                Piatto is accessible globally, including in Europe and Asia. If you are accessing our services from outside 
                the United States, please be aware that your information will be transferred to, stored, and processed in the 
                United States where our servers are located.
              </p>

              <h3 className="text-lg font-semibold text-[#035035] mb-3">GDPR Compliance (EU Users)</h3>
              <p className="text-[#2D2D2D] leading-relaxed mb-3">
                For users in the European Union, you have the following rights under GDPR:
              </p>
              <ul className="list-none space-y-2 mb-4">
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Right to access:</strong> Request a copy of your personal data</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Right to rectification:</strong> Correct inaccurate personal data</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Right to erasure:</strong> Request deletion of your personal data</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Right to data portability:</strong> Receive your data in a structured format</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Right to object:</strong> Object to processing of your personal data</span>
                </li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#035035] mb-4">Cookies and Tracking</h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-3">
                We use cookies and similar tracking technologies to maintain your session and improve user experience:
              </p>
              <ul className="list-none space-y-2 mb-4">
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Essential cookies:</strong> Required for authentication and core functionality</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Analytics cookies:</strong> Help us understand how you use our service</span>
                </li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#035035] mb-4">Third-Party Services</h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-3">
                We use the following third-party services:
              </p>
              <ul className="list-none space-y-2 mb-4">
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Google OAuth:</strong> For authentication (subject to Google's Privacy Policy)</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>OpenAI API:</strong> For AI-powered recipe generation (data processed according to OpenAI's policies)</span>
                </li>
                <li className="flex items-start gap-2 text-[#2D2D2D]">
                  <span className="text-[#FF9B7B] mt-1">•</span>
                  <span><strong>Cloud Storage:</strong> For storing uploaded images and user data</span>
                </li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#035035] mb-4">Children's Privacy</h2>
              <p className="text-[#2D2D2D] leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If you believe we have collected information from a child under 13, 
                please contact us immediately.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#035035] mb-4">Changes to This Privacy Policy</h2>
              <p className="text-[#2D2D2D] leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy 
                Policy periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-[#FFF8F0] border border-[#A8C9B8] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-6 h-6 text-[#FF9B7B]" />
                <h2 className="text-xl font-bold text-[#035035]">Contact Us</h2>
              </div>
              <p className="text-[#2D2D2D] leading-relaxed mb-3">
                If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us:
              </p>
              <Link 
                to="/contact" 
                className="inline-block bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md"
              >
                Contact Support
              </Link>
            </section>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link to="/" className="text-[#035035] hover:text-[#FF9B7B] transition-colors font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
  );
}
