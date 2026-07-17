import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PlatformSettings } from '../types';

export const defaultSettings: PlatformSettings = {
  platformName: 'Teachland',
  logoChar: 'T',
  heroTitle: 'مدرستك كلها في جيبك',
  heroSubtitle: 'شرح مبسط في فيديوهات قصيرة، اختبارات ذكية، ومنافسات مع أصحابك. كل المواد اللي محتاجها من مكان واحد، وفي أي وقت.',
  showGradesSection: true,
  showSubjectsSection: true,
  showFeaturesSection: true,
  showFaqSection: true,
  gradesTitle: 'الصفوف الدراسية المتاحة',
  gradesSubtitle: 'اختر صفك الدراسي المعتمد وابدأ رحلة تميزك الأكاديمي مع أقوى شرح تفاعلي ونخبة من عمالقة التدريس.',
  subjectsTitle: 'استكشف المواد الدراسية',
  subjectsSubtitle: 'نخبة من أفضل المعلمين يقدمون لك شرحاً وافياً ومبسطاً لكل المواد الدراسية بمختلف المراحل.',
  faqTitle: 'الأسئلة الشائعة',
  faqSubtitle: 'إجابات على كل استفساراتك حول المنصة',
  vodafoneCashNumber: '01012345678'
};

interface PlatformSettingsContextType {
  settings: PlatformSettings;
  loading: boolean;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export const usePlatformSettings = () => useContext(PlatformSettingsContext);

export const PlatformSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'platform_settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as PlatformSettings);
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching platform settings:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <PlatformSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};
