import { AppUpdate } from "../types";
// Import version trực tiếp từ package.json (Yêu cầu bật resolveJsonModule trong tsconfig)
import pkg from "../package.json"; 

// 1. Lấy version thực tế từ file cấu hình, không điền tay
export const CURRENT_VERSION = pkg.version; 

/**
 * URL trỏ đến file package.json trên GitHub.
 */
const UPDATE_URL = "https://raw.githubusercontent.com/danghoangsqtt-sys/aura-gen-edu/main/package.json"; 

export const checkAppUpdate = async (): Promise<AppUpdate> => {
  try {
    // 2. Thêm timestamp vào URL để tránh cache CDN của GitHub
    const urlWithNoCache = `${UPDATE_URL}?t=${new Date().getTime()}`;

    const response = await fetch(urlWithNoCache);
    
    if (!response || !response.ok) {
      console.warn(`Lỗi kết nối update server: ${response.status}`);
      // Trả về false thay vì lỗi để app không bị crash
      return { version: CURRENT_VERSION, changelog: [], downloadUrl: "", hasUpdate: false };
    }

    const remoteData = await response.json();
    const remoteVersion = remoteData.version;

    console.log(`Local: ${CURRENT_VERSION} - Remote: ${remoteVersion}`); // Log để debug

    return {
      version: remoteVersion,
      changelog: remoteData.changelog || [],
      // Link đến trang Release để người dùng tải file .exe
      downloadUrl: "https://github.com/danghoangsqtt-sys/edugen-app/releases/latest",
      hasUpdate: isNewerVersion(remoteVersion, CURRENT_VERSION)
    };
  } catch (error) {
    console.error("Lỗi kiểm tra cập nhật:", error);
    return { version: CURRENT_VERSION, changelog: [], downloadUrl: "", hasUpdate: false };
  }
};

const isNewerVersion = (remote: string, local: string): boolean => {
  if (!remote || !local) return false;
  // Loại bỏ ký tự 'v' nếu có (ví dụ v1.0.6)
  const cleanRemote = remote.replace('v', '');
  const cleanLocal = local.replace('v', '');

  const r = cleanRemote.split('.').map(Number);
  const l = cleanLocal.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const rVal = r[i] || 0;
    const lVal = l[i] || 0;
    if (rVal > lVal) return true;
    if (rVal < lVal) return false;
  }
  return false;
};