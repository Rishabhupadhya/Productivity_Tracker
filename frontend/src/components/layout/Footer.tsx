import { useNavigate } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <span 
            className="footer-brand" 
            onClick={handleLogoClick}
            style={{
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Momentum
          </span>
          <span className="footer-separator">•</span>
          <span className="footer-tagline">Consistency that compounds</span>
          <span className="footer-separator">•</span>
          <span className="footer-copy">© {currentYear}</span>
        </div>

        <div className="footer-right">
          <a href="https://techiesblog12.vercel.app/" target="_blank" rel="noopener noreferrer" className="footer-link">Blog</a>
          <a href="mailto:rishabh.292002@gmail.com" className="footer-link">Help</a>
          <a href="https://techiesblog12.vercel.app/privacy-policy" target="_blank" rel="noopener noreferrer" className="footer-link">Privacy</a>
          <a href="https://techiesblog12.vercel.app/terms" target="_blank" rel="noopener noreferrer" className="footer-link">Terms</a>
          <span className="footer-separator">•</span>
          <a href="https://rishabhupadhyay.vercel.app/" target="_blank" rel="noopener noreferrer" className="footer-link footer-portfolio">
            Built by Rishabh Upadhyay
          </a>
          <span className="footer-version">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
