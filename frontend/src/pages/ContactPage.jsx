import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, User, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };



  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulate form submission (replace with actual API call)
    try {
      // TODO: Implement actual contact form submission to backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamContacts = [
    {
      name: 'Markus Huber',
      email: 'piatto+markus@obermui.de',
    },
    {
      name: 'Paul Vorderbruegge',
      email: 'paul.vorderbruegge@tum.de',
    },
    {
      name: 'Luca Bozzetti',
      email: 'luca.bozzetti@tum.de',
    },
    {
      name: 'Sebastian Rogg',
      email: 'sebastian.rogg@tum.de',
    },
  ];

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#FFF8F0] px-4 py-2 rounded-full border border-[#A8C9B8] mb-4">
              <Mail className="w-4 h-4 text-[#035035]" />
              <span className="text-sm font-medium text-[#035035]">Get in Touch</span>
            </div>
            <h1 className="text-5xl font-bold text-[#035035] mb-6">Contact Us</h1>
            <p className="text-xl text-[#2D2D2D] leading-relaxed">
              Have a question, feedback, or just want to say hello? We'd love to hear from you!
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-3xl shadow-lg border border-[#F5F5F5] p-8 md:p-10">
              <h2 className="text-2xl font-bold text-[#035035] mb-6">Send us a Message</h2>

              {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Message Sent!</p>
                    <p className="text-sm text-green-600">We'll get back to you as soon as possible.</p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Error</p>
                    <p className="text-sm text-red-600">Failed to send message. Please try again.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-[#035035] mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A8C9B8]" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D]"
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#035035] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A8C9B8]" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D]"
                      placeholder="john@example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Subject Input */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-[#035035] mb-2">
                    Subject
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A8C9B8]" />
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D]"
                      placeholder="How can we help?"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-[#035035] mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D] resize-none"
                    placeholder="Tell us more about your inquiry..."
                    disabled={isSubmitting}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#035035] text-white py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Direct Contact */}
              <div className="bg-gradient-to-br from-[#FFF8F0] to-white rounded-3xl shadow-lg border border-[#F5F5F5] p-8">
                <h2 className="text-2xl font-bold text-[#035035] mb-6">Direct Contact</h2>
                <p className="text-[#2D2D2D] mb-6">
                  Prefer to reach out directly? Contact our team members:
                </p>
                <div className="space-y-4">
                  {teamContacts.map((contact, index) => (
                    <a
                      key={index}
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 p-4 bg-white border border-[#F5F5F5] rounded-2xl hover:border-[#035035] transition-colors group"
                    >
                      <div className="w-10 h-10 bg-[#FFF8F0] rounded-full flex items-center justify-center group-hover:bg-[#035035] transition-colors">
                        <Mail className="w-5 h-5 text-[#035035] group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#035035]">{contact.name}</p>
                        <p className="text-sm text-[#FF9B7B]">{contact.email}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* FAQ Link */}
              <div className="bg-gradient-to-r from-[#FF9B7B] to-[#FF8A65] text-white rounded-3xl shadow-lg p-8 text-center">
                <h3 className="text-xl font-bold mb-3">Looking for Quick Answers?</h3>
                <p className="mb-4 opacity-90">Check out our frequently asked questions</p>
                <Link
                  to="/about"
                  className="inline-block bg-white text-[#035035] px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all"
                >
                  Learn More About Us
                </Link>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link to="/" className="text-[#035035] hover:text-[#FF9B7B] transition-colors font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
  );
}
