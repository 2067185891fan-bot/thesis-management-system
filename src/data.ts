/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Avatars hotlinked from application frames
export const AVATARS = {
  sterling: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM18_2hEPGuoGOCbtPZjCNC8ZaiPaRJq6hT4O-1fSQ3-rlOXoTXtdVN5a83dm95JIQe8x7BK8hVFDK5_NsYW2qssh-jg-9iV6j47ssdDPj_uFvf_r8KE-AtDxRbV984quiGC7cihAl0Wao7d07cbeW_XS9VlsYiJgBp_SrDIrlxeAxJKCgOZr9HIq1kOUMeaHnIBhDHaOLmqXeUekq8h5Z0NuoWi6qjuJGdatOqPMePy1b3pECTHaQZaYHaZ11GtTk0iNL2Nqwg18',
  vance: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGE0VDco0Mvlo0McJLMnnrNdx71l0ZAheVcz9pNHrlT9EBk4tGslYg9TjmP-MwIyuDEDrG8NQxpzvlOsEr248n85ZU72CdQs101qW8zAbC9c8t-ubvQzd_cdQ57GhbFnpVBmHMUlREvjPEsf3GQjCC0TWZcd3IiKbZd2f_a7SBL2ha9OfAMAd1GzCYbmoy-9Qqs0KY4p2TAnmXgDlqkGx0TigV6mC3qAFWSuE5nYOjBqhIh3Kq7Xkzr-djHm2LFSgzGZjX7pJ8KH8',
  moretti: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcl45KydeK0BXI4U8BjirUv71LfaTFWyfqCgcpdsfmXJMsS_QmvarL7mTeu43ZOKcVozauRio7DSggbFjYeCw0jCNdUeN3YbfHhpFcR70MwFpEFIwwCqIcypMM8knnoVG-g4RcA0r6KSpWfant8SKQ7U8LOmEkooXjvFNl9u_IZFO7y52U2wmccEzF5jfvl5Wg7J6rfhIvbRGVNx-w12HETMj0VYetvBgfbr0NY1RF0Jq8E-OgkYQ4ow9evUg_qVVAn_tFkVuKnjg',
  li: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuEYECTMGo_I_zsBQHtRXmaM1vW_8sdVJtGPduR_aonUkqjU3MsebJt9k_Rc8jXuRDaxqKOFUEfRVKS_HZMhzfVi2NJrIyc1FHKQoEPyytBd594Q7XDySuQiiD44AEsu5jDUAD8yy2biin6_E9IyEKhmEz0wlj58rWsv3IQ1j8LInedRADyYTkwPHI1R9X-rfl2KxX0cXVzDGvTj9s0eh7x6vTPdL2PYcRbu-bn7PQ1g5SMWPqdlN0ADRrMQ87BU12WP8kNepViF0',
  student: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRVogLufdW1c6_GNQ-6vGfnCHhz6Of2v7k1If62Wn8DA27cu0SDpl4OMwgf24okyqvGMi53fEQy4zrk6Iqyp3gd_-WcaYXkah0ykCTagpgnS0e-IYypFRoD5NHSNhueMvfvi39iwAyfyMxwP43ILpestkPKELHPMYhdPp8VOotIz5rW5v_NJUyg6Mxoh13BvGIavEHgXVJ_gnaucnfVMrVgBG6Qvwmpwz20iMgZY8VR01YLwkwyRR3XDFLBmEDwvNQCwQJ6m07Lak',
  chen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCOPF3hYfTU3hNtLgnlrLrjOJ1YmC3nnxN8T4v6pDdCY6a5cl-h5-qSiFZGz8wHyHzSTEeSN6XJ_bfALM65PPdLnfieNWBnbJn2my3a7mrtweMaZajqi57J6SwxPPzv1mf65-x_RwIdjpK_V9weWEnyt24xGSjlxl7pkCl7l04Z4UZI5M3euoKBW_YYxsjyGxyVktoN-DXH6B6JhmO5R4QoAv9mTVO2dAK8YfvjLUQvoq0ZMScHkxF77cfHLKwMA4A51qBqSoktc'
};

// LocalStorage helpers for cross-role data sync simulation
export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('LocalStorage read error for key:', key, error);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('LocalStorage write error for key:', key, error);
  }
}
