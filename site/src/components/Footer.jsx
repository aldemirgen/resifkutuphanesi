import { UI_TEXT } from '../utils/translations';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="footer-icon">🌊</span>
          <span>{UI_TEXT.siteName}</span>
        </div>
        <p className="footer-text">{UI_TEXT.footer}</p>
      </div>
    </footer>
  );
}
