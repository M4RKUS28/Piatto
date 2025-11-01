import { Link } from 'react-router-dom';
import { Award, Users, Sparkles, Linkedin, Mail, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next'

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Markus Huber',
      role: 'Full-Stack Developer',
      description: 'Passionate about creating seamless user experiences and robust backend systems.',
      linkedin: 'https://linkedin.com/in/markus-huber',
      email: 'markus@piatto.app',
      image: '/team/markus.jpg', // Placeholder
    },
    {
      name: 'Paul Vorderbruegge',
      role: 'AI/ML Engineer',
      description: 'Specializing in AI-powered solutions and machine learning integration.',
      linkedin: 'https://linkedin.com/in/paul-vorderbruegge',
      email: 'paul@piatto.app',
      image: '/team/paul.jpg', // Placeholder
    },
    {
      name: 'Luca Bozzetti',
      role: 'Frontend Developer & UX Designer',
      description: 'Crafting beautiful, intuitive interfaces that users love.',
      linkedin: 'https://linkedin.com/in/luca-bozzetti',
      email: 'luca@piatto.app',
      image: '/team/luca.jpg', // Placeholder
    },
    {
      name: 'Sebastian Rogg',
      role: 'Frontend and Data Analytics',
      description: 'Building responsive interfaces and analyzing data to drive insights.',
      linkedin: 'https://linkedin.com/in/sebastian-rogg',
      email: 'sebastian@piatto.app',
      image: '/team/sebastian.jpg', // Placeholder
    },
  ];

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#FFF8F0] px-4 py-2 rounded-full border border-[#A8C9B8] mb-4">
              <Users className="w-4 h-4 text-[#035035]" />
              <span className="text-sm font-medium text-[#035035]">Our Story</span>
            </div>
            <h1 className="text-5xl font-bold text-[#035035] mb-6">About Piatto</h1>
            <p className="text-xl text-[#2D2D2D] leading-relaxed">
              Your AI-powered culinary companion, born from a passion for making cooking accessible, 
              enjoyable, and personalized for everyone.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-gradient-to-br from-[#FFF8F0] to-white rounded-3xl shadow-lg border border-[#F5F5F5] p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-[#035035] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#035035] mb-4">Our Mission</h2>
                  <p className="text-lg text-[#2D2D2D] leading-relaxed mb-4">
                    At Piatto, we believe cooking should be a delightful experience, not a daily chore. 
                    Our mission is to empower home cooks of all skill levels with AI-powered guidance, 
                    personalized recipe suggestions, and an intuitive platform that makes meal planning effortless.
                  </p>
                  <p className="text-lg text-[#2D2D2D] leading-relaxed">
                    Whether you're a seasoned chef or just starting your culinary journey, Piatto adapts 
                    to your preferences, dietary needs, and available ingredients to help you create 
                    delicious meals every day.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hackathon Badge */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-gradient-to-r from-[#035035] to-[#02673d] rounded-3xl shadow-xl p-8 md:p-12 text-white text-center">
              <Award className="w-16 h-16 mx-auto mb-4 text-[#FF9B7B]" />
              <h2 className="text-3xl font-bold mb-3">Google Cloud Run Hackathon</h2>
              <p className="text-lg opacity-90 mb-4">
                Piatto is proudly part of the Google Cloud Run Hackathon on Devpost
              </p>
              <a
                href="https://devpost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-[#035035] px-8 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-lg"
              >
                View on Devpost
              </a>
            </div>
          </div>

          {/* Team Section */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#035035] mb-4">Meet the Team</h2>
              <p className="text-lg text-[#2D2D2D]">
                The passionate creators behind Piatto
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl shadow-lg border border-[#F5F5F5] overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Profile Image Placeholder */}
                  <div className="h-64 bg-gradient-to-br from-[#A8C9B8] to-[#035035] flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                      <Users className="w-16 h-16 text-[#035035]" />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-[#035035] mb-2">{member.name}</h3>
                    <p className="text-[#FF9B7B] font-semibold mb-3">{member.role}</p>
                    <p className="text-[#2D2D2D] mb-6 leading-relaxed">{member.description}</p>

                    {/* Social Links */}
                    <div className="flex gap-3">
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-[#0077B5] text-white py-2 rounded-xl hover:scale-105 transition-all"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm font-medium">LinkedIn</span>
                      </a>
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center justify-center bg-[#FFF8F0] border border-[#A8C9B8] text-[#035035] w-10 h-10 rounded-xl hover:scale-105 transition-all"
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#035035] mb-4">Built with Modern Technology</h2>
              <p className="text-lg text-[#2D2D2D]">
                Leveraging cutting-edge tools and platforms
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#FFF8F0] border border-[#A8C9B8] rounded-2xl p-6">
                <h3 className="text-xl font-bold text-[#035035] mb-3">Frontend</h3>
                <ul className="space-y-2 text-[#2D2D2D]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF9B7B]">•</span>
                    React & Vite
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF9B7B]">•</span>
                    TailwindCSS
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF9B7B]">•</span>
                    React Router
                  </li>
                </ul>
              </div>

              <div className="bg-[#FFF8F0] border border-[#A8C9B8] rounded-2xl p-6">
                <h3 className="text-xl font-bold text-[#035035] mb-3">Backend & Infrastructure</h3>
                <ul className="space-y-2 text-[#2D2D2D]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF9B7B]">•</span>
                    Python & FastAPI
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF9B7B]">•</span>
                    Google Cloud Run
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF9B7B]">•</span>
                    OpenAI API
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-lg border border-[#F5F5F5] p-8 md:p-12">
              <h2 className="text-3xl font-bold text-[#035035] mb-4">Join Our Culinary Community</h2>
              <p className="text-lg text-[#2D2D2D] mb-8">
                Start your journey with Piatto today and discover the joy of AI-powered cooking
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="bg-[#035035] text-white px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/contact"
                  className="bg-transparent border-2 border-[#FF9B7B] text-[#FF9B7B] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#FF9B7B] hover:text-white transition-all"
                >
                  Contact Us
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
