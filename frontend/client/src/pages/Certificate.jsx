import { useState, useRef, useLayoutEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";
import signatureImage from "../assets/image.png";
import "./Certificate.css";
import { ArrowLeft, Download, Award, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Certificate() {
  useTheme();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const courseName = searchParams.get("courseName") || "Advanced Full-Stack Engineering Bootcamp";
  const [studentName] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).name || "Honorable Graduate" : "Honorable Graduate";
    } catch {
      return "Honorable Graduate";
    }
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);

  const [issueDate] = useState(() => 
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  );
  const [certId] = useState(() => "SU-" + (
    window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID().split('-')[0] : Math.random().toString(36).slice(2, 11)
  ).toUpperCase());

  useLayoutEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const availableWidth = wrapperRef.current.parentElement.clientWidth - 40;
        const newScale = Math.min(availableWidth / 1200, 1);
        setScale(newScale);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const downloadAs = async (format = 'pdf') => {
    setIsDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const element = certificateRef.current;
      if (!element) {
        throw new Error('Certificate element not found');
      }

      await document.fonts.ready;

      const originalTransform = element.style.transform;
      element.style.setProperty('transform', 'scale(1)', 'important');

      const canvas = await html2canvas(element, {
        scale: 3, // High DPI capture
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        backgroundColor: '#fdfbf7',
        logging: false,
        width: 1200,
        height: 850,
        windowWidth: 1200,
        windowHeight: 850,
        x: 0,
        y: 0,
      });

      if (originalTransform) {
        element.style.transform = originalTransform;
      } else {
        element.style.removeProperty('transform');
      }

      if (format === 'png') {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png', 1.0);
        link.download = `${studentName.replace(/\s+/g, '_')}_Certificate_${certId}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 210],
        compress: false,
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${studentName.replace(/\s+/g, '_')}_Certificate_${certId}.pdf`);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to output your premium certificate. Please retry.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="certificate-page-wrapper">
      <Navbar />
      
      <main className="certificate-main">
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", width: "100%" }}>
          
          {/* Back Action Header */}
          <div style={{ width: "min(1200px, 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button 
              onClick={() => navigate("/dashboard")}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <ArrowLeft size={16} />
              Return to Dashboard
            </button>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
              Secure Credentials Verification Channel
            </span>
          </div>

          {/* Certificate Frame Scaling Frame */}
          <div className="certificate-scale-wrapper" ref={wrapperRef}>
            <div style={{ width: `${1200 * scale}px`, height: `${850 * scale}px` }} className="certificate-scaled-content">
              <div 
                ref={certificateRef} 
                className="certificate-container" 
                id="certificate-node"
                style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
              >
                {/* Dual Borders */}
                <div className="glass-border-1" />
                <div className="glass-border-2" />

                {/* Subdued Watermark Background */}
                <div className="watermark-symbol">
                  <div className="watermark-text">CERT</div>
                </div>

                <div className="certificate-content-wrapper">
                  {/* Top Header Block */}
                  <div className="certificate-header">
                    <div className="logo-section">
                      <span className="logo-title">SkillUp Hub Academy</span>
                      <span className="logo-subtitle">Executive Board Credentials</span>
                    </div>

                    <div className="qr-code-section">
                      <img 
                        src={`https://quickchart.io/qr?text=${encodeURIComponent(window.location.href)}&size=200`}
                        alt="Verification QR Code"
                        crossOrigin="anonymous"
                        className="qr-code-image"
                      />
                      <span className="qr-code-label">Verify Authentic</span>
                    </div>
                  </div>

                  {/* Central Body Block */}
                  <div className="certificate-body">
                    <div className="completion-badge">
                      <span className="completion-text">Honorary Credential of Completion</span>
                    </div>

                    <p className="certification-intro">This executive decree validates that</p>

                    <div className="student-name">
                      {studentName}
                    </div>

                    <p className="completion-pre-text">has systematically completed all academic standards for</p>
                    
                    <h2 className="course-name">
                      {courseName}
                    </h2>
                  </div>

                  {/* Footer Credentials & Seals Block */}
                  <div className="certificate-footer">
                    
                    {/* Date Issued Column */}
                    <div className="footer-item">
                      <p className="footer-value-date">{issueDate}</p>
                      <p className="footer-label">Date of Matriculation</p>
                    </div>

                    {/* Central Gold Medallion & ID */}
                    <div className="gold-seal-wrapper">
                      {/* Premium Vector Gold Seal Ribbon */}
                      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.15))" }}>
                        {/* Hanging Ribbon left */}
                        <path d="M40 50 L30 90 L45 80 L60 90 L50 50 Z" fill="#b8860b" opacity="0.85" />
                        {/* Hanging Ribbon right */}
                        <path d="M60 50 L70 90 L55 80 L40 90 L50 50 Z" fill="#d4af37" opacity="0.9" />
                        
                        {/* Outer serrated gold ring */}
                        <circle cx="50" cy="45" r="32" fill="#d4af37" stroke="#b8860b" strokeWidth="1.5" />
                        {/* Inner concentric gold rings */}
                        <circle cx="50" cy="45" r="27" fill="none" stroke="#fdfbf7" strokeWidth="1.5" strokeDasharray="3 2" />
                        <circle cx="50" cy="45" r="24" fill="#0b2545" />
                        
                        {/* Medallion Core Star Emblem */}
                        <path d="M50 29 L54 39 L65 39 L57 46 L60 56 L50 49 L40 56 L43 46 L35 39 L46 39 Z" fill="#d4af37" />
                      </svg>
                      
                      <div className="cert-id-box">
                        <p className="cert-id-value">{certId}</p>
                        <p className="cert-id-label">Credential Identification</p>
                      </div>
                    </div>

                    {/* Verified Signature Column */}
                    <div className="footer-item">
                      <div className="signature-image-wrapper">
                        <img src={signatureImage} alt="Verified Signature" className="signature-image" />
                      </div>
                      <p className="footer-label">Authorized Registrar</p>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Download Operations */}
          <div className="certificate-input-section">
            <div className="download-buttons-container">
              <button
                onClick={() => downloadAs('png')}
                disabled={isDownloading}
                className="certificate-download-btn"
                style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"}
              >
                <Download size={16} />
                {isDownloading ? "Generating..." : "Download High-Res PNG"}
              </button>

              <button
                onClick={() => downloadAs('pdf')}
                disabled={isDownloading}
                className="certificate-download-btn"
              >
                <Award size={16} />
                {isDownloading ? "Generating..." : "Download Official PDF"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
