// Asset exports - dễ dàng import hoặc thay thế logo Sở Cảnh Sát
import pdLogoImg from './logo/pd-logo.png';
import sheriffLogoImg from './logo/sherifflogo.png';
import saspLogoImg from './logo/sasplogo.png';
import lspdLogoImg from './logo/lspd.png';

export const ASSETS = {
  // Đường dẫn logo PD chính
  pdLogo: '/logo.png',
  pdLogoSrc: pdLogoImg,
  pdLogoPublic: '/logo.png',

  // Logo các sở cảnh sát đặc thù
  sheriffLogo: '/sherifflogo.png',
  sheriffLogoSrc: sheriffLogoImg,
  saspLogo: '/sasplogo.png',
  saspLogoSrc: saspLogoImg,
  lspdLogo: '/lspd.png',
  lspdLogoSrc: lspdLogoImg,

  // Helper lấy logo theo mã sở
  getDepartmentLogo: (deptId?: string): string => {
    const norm = deptId?.toLowerCase();
    if (norm === 'lspd' || norm === 'police_dept') return '/lspd.png';
    if (norm === 'bcso' || norm === 'sheriff') return '/sherifflogo.png';
    if (norm === 'sasp' || norm === 'state_police') return '/sasplogo.png';
    return '/lspd.png';
  },

  getDepartmentName: (deptId?: string): string => {
    const norm = deptId?.toLowerCase();
    if (norm === 'lspd') return 'Los Santos Police Department';
    if (norm === 'bcso') return "Blaine County Sheriff's Office";
    if (norm === 'sasp') return 'San Andreas State Police';
    return 'Los Santos Police Department';
  },
};

export default ASSETS;
