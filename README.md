# 🧠 ManoSaathi - Digital Mental Health Platform

[![Smart India Hackathon 2025](https://img.shields.io/badge/SIH-2025-blue.svg)](https://www.sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/PS%20ID-25092-green.svg)]()
[![Theme](https://img.shields.io/badge/Theme-MedTech%2FBioTech%2FHealthTech-orange.svg)]()
[![Category](https://img.shields.io/badge/Category-Software-red.svg)]()
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black.svg)](https://mano-saathi.vercel.app/)

> **ManoSaathi** (मनोसाथी) - "Friend of the Mind" - A comprehensive digital mental health and psychological support system specifically designed for students in higher education institutions across India.

## 🌟 Overview

ManoSaathi addresses the critical mental health crisis in Indian higher education by providing a culturally-sensitive, multilingual, and comprehensive digital support platform. Built for **Smart India Hackathon 2025**, this solution tackles Problem Statement 25092 with innovative features designed to save lives and improve student wellbeing.

### 📊 The Problem

- **60%** of college students experience anxiety and depression
- **35%** of suicides in India involve young adults aged 18-30
- **Over 1.7 lakh suicide deaths** in 2022 - the highest in 56 years
- **37.4 million students** in Indian higher education institutions remain underserved

### 💡 Our Solution

A comprehensive digital ecosystem providing:
- 🤖 **AI-powered crisis detection** with validated clinical assessments
- 🤝 **Anonymous peer support forums** moderated by trained student volunteers
- 📚 **Multilingual resource hub** in Hindi, English, and Urdu
- 📅 **Integrated counselor booking** system
- 📊 **Real-time analytics dashboard** for institutional policy-making

## 🚀 Key Features

### 🔍 AI-Guided First Aid Support
- **Instant crisis detection** using PHQ-9 and GAD-7 assessments
- **Multilingual support** for regional Indian languages
- **Real-time escalation** to professional counselors
- **Immediate coping strategies** and breathing exercises

### 🤝 Peer Support Platform
- **Anonymous community forums** with category-based discussions
- **Trained student moderators** for crisis intervention
- **Supportive reaction system** (hearts, hugs, encouragement)
- **Cultural sensitivity** for Indian college-specific stressors

### 📚 Psychoeducational Resource Hub
- **Multimedia content** (videos, audio, articles, PDFs)
- **Regional language support** (Hindi, English, Urdu)
- **Categorized resources** for academic stress, career anxiety, family pressure
- **Progress tracking** and personalized recommendations

### 📅 Counselor Booking System
- **Real-time availability** management
- **Anonymous booking** options
- **Campus integration** with existing counseling centers
- **Automated reminders** and status notifications

### 📊 Admin Analytics Dashboard
- **Anonymous usage statistics** and trend analysis
- **Crisis intervention metrics** and response times
- **Resource utilization reports** for data-driven policies
- **Institutional mental health insights**

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for responsive design
- **React Router** for navigation
- **React Query** for state management
- **Framer Motion** for animations

### Backend
- **Supabase** (PostgreSQL database)
- **Real-time subscriptions** for live updates
- **Row Level Security** for data protection
- **Supabase Auth** for authentication
- **Supabase Storage** for media files

### AI/ML Integration
- **Google Gemini API** for conversational AI
- **Crisis detection algorithms** with keyword matching
- **Sentiment analysis** for mood tracking
- **Natural Language Processing** for multilingual support

### Deployment
- **Vercel** for frontend hosting
- **Progressive Web App** (PWA) capabilities
- **Mobile-responsive** design
- **Offline functionality** for rural connectivity

## 📱 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Gemini API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/manosaathi.git
   cd manosaathi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your environment variables:
   ```env
   VITE_SUPABASE_PROJECT_ID=your_supabase_projectid
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   ```bash
   # Run the SQL schema in your Supabase dashboard
   # Import the database schema from /database/schema.sql
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## 🌍 Deployment

### Deploy to Vercel

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** with automatic CI/CD

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/manosaathi)

### Environment Variables for Production
```env
VITE_SUPABASE_PROJECT_ID=your_supabase_projectid
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_GEMINI_API_KEY=your_gemini_api_key

```

## 📂 Project Structure

```
manosaathi/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── AIChat/       # AI chatbot components
│   │   ├── PeerSupport/  # Peer support platform
│   │   ├── Resources/    # Resource hub
│   │   ├── Booking/      # Counselor booking
│   │   └── Admin/        # Admin dashboard
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services and utilities
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helper functions
│   └── styles/           # CSS and styling
├── database/             # Database schema and migrations
├── docs/                 # Documentation
└── README.md
```

## 🔒 Privacy & Security

### Data Protection
- **End-to-end encryption** for sensitive communications
- **Anonymous by default** - no personal information required
- **GDPR compliant** data handling
- **Row Level Security** in Supabase database

### Crisis Safety Measures
- **Real-time crisis detection** with immediate professional alerts
- **Trained moderator escalation** within 5 minutes
- **Emergency contact integration** with campus counseling centers
- **Audit logging** for all crisis interventions

## 🎯 Problem Statement Alignment

**PS ID 25092**: Development of a Digital Mental Health and Psychological Support System for Students in Higher Education

### ✅ Requirements Fulfilled

1. **AI-guided First-Aid Support** ✅
   - Interactive chatbot with coping strategies
   - Professional referral system
   - Crisis detection and immediate response

2. **Confidential Booking System** ✅
   - Anonymous appointment scheduling
   - Campus counselor integration
   - Real-time availability management

3. **Psychoeducational Resource Hub** ✅
   - Videos, audio, and guides in regional languages
   - Cultural sensitivity for Indian context
   - Offline access capabilities

4. **Peer Support Platform** ✅
   - Moderated forums with trained volunteers
   - Anonymous peer-to-peer support
   - Community-driven healing

5. **Admin Dashboard** ✅
   - Anonymous analytics for policy insights
   - Crisis intervention tracking
   - Institutional mental health trends



### Competitive Advantages
- ✅ **FREE and accessible** to all students
- ✅ **Culturally adapted** for Indian college context
- ✅ **Multilingual support** (Hindi, English, Urdu)
- ✅ **Campus integration** with existing counseling systems
- ✅ **Proven clinical tools** (PHQ-9, GAD-7 assessments)
- ✅ **Real-time crisis intervention** capabilities

## 📈 Impact & Metrics

### Expected Outcomes
- **40% increase** in mental health service utilization
- **50% reduction** in counselor administrative workload
- **5-7% decrease** in student dropout rates
- **Real-time crisis intervention** within 2 minutes

### Scalability
- **Phase 1**: Pilot with 5 colleges in J&K (3 months)
- **Phase 2**: State-wide rollout across J&K institutions (6 months)
- **Phase 3**: National scaling with NEP 2020 compliance (12 months)

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

### Emergency Resources
- **KIRAN Mental Health Helpline**: 1800-599-0019
- **National Suicide Prevention Helpline**: 9152987821



### Project Links
- **Live Demo**: [https://manosaathi.vercel.app](https://manosaathi.vercel.app)
- **GitHub Repository**: [https://github.com/your-username/manosaathi](https://github.com/your-username/manosaathi)


---

## 🙏 Acknowledgments

- **Smart India Hackathon 2025** for the opportunity to address this critical social issue
- **Government of Jammu and Kashmir** for identifying this important problem statement
- **KIRAN Mental Health Initiative** for providing crisis support infrastructure
- **Open source community** for the amazing tools and libraries that made this possible

---

**"Every student deserves mental wellness support. ManoSaathi is not just our solution – it's India's digital mental health revolution."**

---

⭐ **If this project helped you or could help others, please star this repository!**

[![GitHub stars](https://img.shields.io/github/stars/your-username/manosaathi.svg?style=social&label=Star)](https://github.com/your-username/manosaathi)
[![GitHub forks](https://img.shields.io/github/forks/your-username/manosaathi.svg?style=social&label=Fork)](https://github.com/your-username/manosaathi/fork)
[![GitHub watchers](https://img.shields.io/github/watchers/your-username/manosaathi.svg?style=social&label=Watch)](https://github.com/your-username/manosaathi)

#MentalHealth #DigitalIndia #StudentWellness #ManoSaathi
