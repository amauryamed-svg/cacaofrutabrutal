import React, { useEffect } from 'react';
import LogoCaua from '../assets/logo-caua.svg';

export default function CincoTiemposProposal() {
  useEffect(() => {
    // Auto-trigger print on component mount for PDF export
    // Uncomment to auto-print: window.print();
  }, []);

  return (
    <>
    <div className="proposal-container">
      {/* HEADER */}
      <header className="proposal-header">
        <div className="header-content">
          <img src={LogoCaua} alt="Caúa Logo" className="header-logo" />
          <div className="header-text">
            <h3 className="tagline">Turismo Sostenible × Cacao Regenerativo</h3>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="proposal-main">
        {/* HERO SECTION */}
        <section className="hero-section">
          <h1 className="proposal-title">Cinco Tiempos de Cacao</h1>
          <p className="proposal-subtitle">Experiencia Sensorial Inmersiva</p>
          <p className="intro-text">
            Una jornada transformadora a través de la cadena regenerativa del cacao.
            Desde el árbol ancestral hasta la barra artesanal, descubre el viaje completo
            que desafía la industria tradicional del chocolate.
            Inspirado en <a href="https://cacaofrutabrutal.com" target="_blank" rel="noopener noreferrer">cacaofrutabrutal.com</a>
          </p>
        </section>

        {/* CINCO TIEMPOS GRID */}
        <section className="cinco-tiempos">
          <div className="tiempo tiempo-1">
            <div className="tiempo-number">01</div>
            <h3 className="tiempo-title">Árbol al Fruto</h3>
            <p className="tiempo-text">
              Mazorca fresca recién cosechada. Conoce el ciclo natural de la reproducción
              del Theobroma cacao en ecosistemas regenerativos de Arauca.
            </p>
          </div>

          <div className="tiempo tiempo-2">
            <div className="tiempo-number">02</div>
            <h3 className="tiempo-title">Origen Regenerativo</h3>
            <p className="tiempo-text">
              Cacao liofilizado desde Arauca, Tame. Sabor puro de la fuente, sin procesamiento
              que altere el origen. Trazabilidad total del agricultor.
            </p>
          </div>

          <div className="tiempo tiempo-3">
            <div className="tiempo-number">03</div>
            <h3 className="tiempo-title">Valor Agregado</h3>
            <p className="tiempo-text">
              Mucílago liofilizado y nibs tostados. Transformación artesanal que multiplica
              el valor del cultivo mientras preserva sabores ancestrales.
            </p>
          </div>

          <div className="tiempo tiempo-4">
            <div className="tiempo-number">04</div>
            <h3 className="tiempo-title">Refinación Artesanal</h3>
            <div className="tiempo-detail">
              <span className="detail-label">Hobo Huila</span>
              <span className="detail-separator">|</span>
              <span className="detail-value">Finca Santa María</span>
              <span className="detail-separator">|</span>
              <span className="detail-value">Cacao 100% Licor</span>
              <span className="detail-separator">|</span>
              <span className="detail-value">250gr</span>
            </div>
          </div>

          <div className="tiempo tiempo-5">
            <div className="tiempo-number">05</div>
            <h3 className="tiempo-title">Ancestral & Moderno</h3>
            <p className="tiempo-text">
              Sunrise Shot cold brew. La fusión de técnicas prehispánicas con métodos
              contemporáneos. Cacao líquido, servido a temperatura ritual.
            </p>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="pricing-section">
          <h2 className="section-title">Inversión</h2>
          <div className="pricing-grid">
            <div className="pricing-card base">
              <h3 className="pricing-title">Experiencia Base</h3>
              <p className="pricing-price">$60.000</p>
              <ul className="pricing-list">
                <li>5 Tiempos de Cacao</li>
                <li>Catas guiadas</li>
                <li>Narrativa regenerativa</li>
                <li>Implementos incluidos</li>
              </ul>
            </div>

            <div className="pricing-card premium">
              <h3 className="pricing-title">Premium + Barra</h3>
              <p className="pricing-price">$100.000</p>
              <ul className="pricing-list">
                <li>Todo experiencia Base</li>
                <li><strong>+ Barra 250g</strong></li>
                <li><strong>Hobo Huila artesanal</strong></li>
                <li>Para llevar y recordar</li>
              </ul>
            </div>
          </div>
        </section>

        {/* TRIPLE IMPACTO SECTION */}
        <section className="triple-impacto">
          <h2 className="section-title">Triple Impacto</h2>
          <div className="impacto-grid">
            <div className="impacto-card community">
              <h3 className="impacto-title">Comunidad</h3>
              <p className="impacto-text">
                Desarrollo económico en Arauca, Santander, Cundinamarca y Meta.
                Empoderamiento de agricultores y sus familias.
              </p>
            </div>

            <div className="impacto-card farmer">
              <h3 className="impacto-title">Agricultor</h3>
              <p className="impacto-text">
                Multiplicador de ingresos sostenibles. Acceso directo a mercados
                premium sin intermediarios extractivos.
              </p>
            </div>

            <div className="impacto-card ecosystem">
              <h3 className="impacto-title">Ecosistema</h3>
              <p className="impacto-text">
                Agroforestería regenerativa. Captura de carbono, biodiversidad y
                resiliencia climática integrada en cada cultivo.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="proposal-footer">
        <div className="footer-content">
          <div className="footer-facilitators">
            <div className="facilitator">
              <p><strong>Facilitador:</strong> Amaury Amed | CTO Caúa</p>
            </div>
            <div className="facilitator">
              <p><strong>Educadora:</strong> Andrea | Prof. Turismo Sostenible | Universidad CESA</p>
            </div>
          </div>

          <div className="footer-details">
            <p className="detail"><strong>Formato:</strong> Salón con video beam + implementos incluidos</p>
          </div>

          <div className="footer-cta">
            <p className="footer-motto">Del árbol a la barra</p>
            <a href="https://cacaofrutabrutal.com" className="footer-link" target="_blank" rel="noopener noreferrer">
              cacaofrutabrutal.com
            </a>
          </div>
        </div>
      </footer>
    </div>

    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Lato:wght@300;400;700&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body, html {
        width: 100%;
        height: 100%;
      }

      .proposal-container {
        width: 210mm;
        height: 297mm;
        margin: 0 auto;
        background-color: #F7F1EE;
        font-family: 'Lato', sans-serif;
        color: #2c2c2c;
        display: flex;
        flex-direction: column;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
      }

      /* HEADER */
      .proposal-header {
        height: 140px;
        background: linear-gradient(135deg, #1C3B26 0%, #0f1e19 100%);
        border-bottom: 6px solid #F1A91E;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 40px;
        flex-shrink: 0;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 24px;
        max-width: 100%;
      }

      .header-logo {
        height: 80px;
        width: auto;
        flex-shrink: 0;
      }

      .header-text {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .tagline {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px;
        font-weight: 400;
        color: #F7F1EE;
        letter-spacing: 1px;
        line-height: 1.3;
      }

      /* MAIN CONTENT */
      .proposal-main {
        flex: 1;
        overflow-y: auto;
        padding: 40px;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      /* HERO SECTION */
      .hero-section {
        text-align: center;
        margin-bottom: 12px;
      }

      .proposal-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 56px;
        font-weight: 700;
        color: #1C3B26;
        margin-bottom: 8px;
        letter-spacing: -1px;
      }

      .proposal-subtitle {
        font-family: 'Cormorant Garamond', serif;
        font-size: 24px;
        font-weight: 400;
        color: #91A63B;
        margin-bottom: 16px;
        letter-spacing: 0.5px;
      }

      .intro-text {
        font-size: 13px;
        line-height: 1.6;
        color: #4a4a4a;
        max-width: 600px;
        margin: 0 auto;
      }

      .intro-text a {
        color: #DB5527;
        text-decoration: none;
        font-weight: 600;
        border-bottom: 1px solid #DB5527;
      }

      /* CINCO TIEMPOS */
      .cinco-tiempos {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px 32px;
        margin-bottom: 12px;
      }

      .tiempo {
        padding: 20px;
        border-left: 4px solid #91A63B;
        background-color: rgba(241, 169, 30, 0.04);
        border-radius: 2px;
        animation: fadeIn 0.6s ease-out;
      }

      .tiempo-1, .tiempo-2, .tiempo-3 {
        animation-delay: 0.1s;
      }

      .tiempo-2, .tiempo-4 {
        animation-delay: 0.2s;
      }

      .tiempo-3, .tiempo-5 {
        animation-delay: 0.3s;
      }

      .tiempo-4 {
        grid-column: 1 / -1;
        max-width: 50%;
      }

      .tiempo-5 {
        grid-column: 1 / -1;
        max-width: 50%;
        justify-self: end;
      }

      .tiempo-number {
        font-family: 'Cormorant Garamond', serif;
        font-size: 28px;
        font-weight: 700;
        color: #8D2679;
        margin-bottom: 6px;
      }

      .tiempo-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 18px;
        font-weight: 600;
        color: #1C3B26;
        margin-bottom: 8px;
      }

      .tiempo-text {
        font-size: 12px;
        line-height: 1.5;
        color: #4a4a4a;
      }

      .tiempo-detail {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        font-size: 12px;
      }

      .detail-label {
        font-weight: 700;
        color: #1C3B26;
      }

      .detail-separator {
        color: #91A63B;
        font-weight: 300;
      }

      .detail-value {
        color: #4a4a4a;
      }

      /* PRICING SECTION */
      .pricing-section {
        margin-bottom: 12px;
      }

      .section-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 28px;
        font-weight: 600;
        color: #1C3B26;
        margin-bottom: 16px;
        border-bottom: 2px solid #F1A91E;
        padding-bottom: 8px;
      }

      .pricing-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .pricing-card {
        padding: 20px;
        border-radius: 2px;
        border: 1px solid #e0e0e0;
      }

      .pricing-card.base {
        background-color: rgba(145, 166, 59, 0.08);
        border-color: #91A63B;
      }

      .pricing-card.premium {
        background-color: rgba(141, 38, 121, 0.08);
        border-color: #8D2679;
        border-width: 2px;
      }

      .pricing-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px;
        font-weight: 600;
        color: #1C3B26;
        margin-bottom: 8px;
      }

      .pricing-price {
        font-family: 'Cormorant Garamond', serif;
        font-size: 32px;
        font-weight: 700;
        color: #DB5527;
        margin-bottom: 12px;
      }

      .pricing-list {
        font-size: 11px;
        line-height: 1.6;
        color: #4a4a4a;
        list-style: none;
      }

      .pricing-list li {
        margin-bottom: 4px;
      }

      .pricing-list li::before {
        content: "◆ ";
        color: #91A63B;
        margin-right: 6px;
      }

      /* TRIPLE IMPACTO */
      .triple-impacto {
        margin-bottom: 12px;
      }

      .impacto-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .impacto-card {
        padding: 16px;
        border-radius: 2px;
        text-align: center;
      }

      .impacto-card.community {
        background-color: rgba(28, 59, 38, 0.08);
        border-top: 3px solid #1C3B26;
      }

      .impacto-card.farmer {
        background-color: rgba(241, 169, 30, 0.08);
        border-top: 3px solid #F1A91E;
      }

      .impacto-card.ecosystem {
        background-color: rgba(219, 85, 39, 0.08);
        border-top: 3px solid #DB5527;
      }

      .impacto-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px;
        font-weight: 600;
        color: #1C3B26;
        margin-bottom: 8px;
      }

      .impacto-text {
        font-size: 11px;
        line-height: 1.5;
        color: #4a4a4a;
      }

      /* FOOTER */
      .proposal-footer {
        background: linear-gradient(135deg, #1C3B26 0%, #0f1e19 100%);
        border-top: 6px solid #F1A91E;
        padding: 20px 40px;
        color: #F7F1EE;
        font-size: 11px;
        line-height: 1.5;
        flex-shrink: 0;
      }

      .footer-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .footer-facilitators {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
      }

      .facilitator {
        flex: 1;
        min-width: 200px;
      }

      .facilitator p {
        margin: 0;
      }

      .footer-details {
        font-size: 10px;
      }

      .detail {
        margin: 0;
      }

      .footer-cta {
        text-align: center;
        padding-top: 8px;
        border-top: 1px solid rgba(247, 241, 238, 0.3);
      }

      .footer-motto {
        font-family: 'Cormorant Garamond', serif;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .footer-link {
        color: #F1A91E;
        text-decoration: none;
        font-weight: 600;
        border-bottom: 1px solid #F1A91E;
      }

      .footer-link:hover {
        color: #DB5527;
        border-bottom-color: #DB5527;
      }

      /* ANIMATIONS */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* PRINT STYLES */
      @media print {
        body, html {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
        }

        .proposal-container {
          width: 210mm;
          height: 297mm;
          box-shadow: none;
          margin: 0;
          page-break-after: always;
        }

        .proposal-main {
          overflow: visible;
          padding: 30px 40px;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        @page {
          size: A4;
          margin: 0;
        }
      }

      /* RESPONSIVE FOR SCREEN */
      @media screen and (max-width: 1024px) {
        .proposal-container {
          width: 100%;
          max-width: 800px;
          height: auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .proposal-title {
          font-size: 42px;
        }

        .cinco-tiempos {
          grid-template-columns: 1fr;
        }

        .tiempo-4, .tiempo-5 {
          grid-column: 1;
          max-width: 100%;
          justify-self: auto;
        }

        .pricing-grid, .impacto-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
    </>
  );
}
