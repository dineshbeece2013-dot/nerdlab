import React from 'react';

// The formal, printable certificate. Deliberately light-on-white with inline
// colours rather than the app's dark theme: this is the version that goes on
// paper or into a PDF, where the dark UI palette would be unreadable.
const CertificateSheet = ({ certificate, recipientName }) => {
  if (!certificate) return null;

  const issued = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#0f172a',
        background: '#ffffff',
        border: '10px solid #0ea5e9',
        padding: '40px 48px',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: 18, marginBottom: 28 }}>
        <div style={{ fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#0284c7', fontWeight: 700 }}>
          NerdLab Learning Platform
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Interactive DevOps hands-on labs</div>
      </div>

      <div style={{ fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#64748b' }}>
        Certificate of Completion
      </div>

      <div style={{ fontSize: 13, color: '#475569', marginTop: 28 }}>This certifies that</div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 800,
          margin: '10px 0 6px',
          color: '#0f172a',
          borderBottom: '2px solid #0ea5e9',
          display: 'inline-block',
          padding: '0 28px 6px',
        }}
      >
        {recipientName || 'NerdLab Student'}
      </div>

      <div style={{ fontSize: 13, color: '#475569', marginTop: 22 }}>
        has successfully completed every exercise in the lab
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0', color: '#0369a1' }}>{certificate.title}</div>
      {certificate.category_name && (
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {certificate.category_name}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 46,
          paddingTop: 16,
          borderTop: '1px solid #cbd5e1',
          fontSize: 11,
          color: '#475569',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', fontSize: 9 }}>
            Date issued
          </div>
          <div style={{ fontWeight: 700, marginTop: 3 }}>{issued}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', fontSize: 9 }}>
            Certificate code
          </div>
          <div style={{ fontFamily: 'Consolas, monospace', fontWeight: 700, marginTop: 3 }}>
            {certificate.certificate_code}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateSheet;
