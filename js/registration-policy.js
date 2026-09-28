(function (root) {
  'use strict';
  function isOpen(settings) {
    return settings?.waveStatus === 'open' && ['wave1', 'wave2', 'wave3'].includes(settings.activeWave);
  }
  function message(settings) {
    return settings?.waveStatus === 'upcoming'
      ? 'Pendaftaran segera dibuka. Silakan kembali setelah gelombang pendaftaran dibuka.'
      : 'Pendaftaran belum dibuka atau ditutup sementara. Silakan pantau pengumuman panitia.';
  }
  const policy = { isOpen, message };
  if (typeof module !== 'undefined' && module.exports) module.exports = policy;
  else root.RegistrationPolicy = policy;
})(globalThis);
