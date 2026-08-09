import React, { useState, useEffect } from 'react';
import { CandidateProfile, TailoredResumeResult, AppScreen } from './types';
import { Header } from './components/Header';
import { ResumeGeneratorForm } from './components/ResumeGeneratorForm';
import { ProfileForm } from './components/ProfileForm';
import { ResultsView } from './components/ResultsView';
import { ATSResumeBuilder } from './components/ATSResumeBuilder';

const LOCAL_STORAGE_PROFILE_KEY = 'resumatch_profile_v1';

const EMPTY_PROFILE: CandidateProfile = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: ''
  },
  education: [],
  workExperience: [],
  projects: [],
  skills: [],
  certifications: []
};

export default function App() {
  const [profile, setProfile] = useState<CandidateProfile>(EMPTY_PROFILE);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('generator');
  const [tailoredResult, setTailoredResult] = useState<TailoredResumeResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.personalInfo) {
          setProfile(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse saved profile from local storage:', e);
    }
  }, []);

  // Save profile to local storage and state
  const handleSaveProfile = (updatedProfile: CandidateProfile) => {
    setProfile(updatedProfile);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.error('Failed to save profile to local storage:', e);
    }
  };

  // Screen navigation with top scroll
  const handleNavigate = (screen: AppScreen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit tailoring request to Express server /api/tailor-resume
  const handleTailorResume = async (
    oldResumeText: string,
    jobDescription: string,
    jobTitle: string,
    companyName: string,
    candidateNameOverride?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTailoredResult(null); // FULL STATE RESET: Clear previous result state

    try {
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldResumeText,
          jobDescription,
          targetJobTitle: jobTitle,
          targetCompany: companyName,
          candidateNameOverride: candidateNameOverride?.trim() || undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to generate tailored resume. Please try again.');
      }

      setTailoredResult({
        ...json.data,
        targetJobTitle: jobTitle || undefined,
        targetCompany: companyName || undefined,
        createdAt: new Date().toISOString(),
      });

      setCurrentScreen('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Tailoring error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while processing with AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        hasResult={Boolean(tailoredResult)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {currentScreen === 'generator' && (
          <>
            <ResumeGeneratorForm
              onSubmit={handleTailorResume}
              isLoading={isLoading}
              errorMessage={errorMessage}
              onClearError={() => setErrorMessage(null)}
            />
            <div className="mt-8">
              <ATSResumeBuilder profile={profile} tailoredResult={tailoredResult} />
            </div>
          </>
        )}

        {currentScreen === 'profile' && (
          <ProfileForm
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onNextStep={() => handleNavigate('generator')}
          />
        )}

        {currentScreen === 'results' && tailoredResult && (
          <ResultsView
            profile={profile}
            result={tailoredResult}
            onEditProfile={() => handleNavigate('profile')}
            onTryAnotherJD={() => handleNavigate('generator')}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} ResuMatch AI — Instant ATS Resume Tailoring Platform</p>
          <div className="flex items-center gap-4 text-slate-600">
            <button onClick={() => handleNavigate('generator')} className="hover:text-blue-600 transition-colors cursor-pointer font-medium">Generator</button>
            {tailoredResult && (
              <button onClick={() => handleNavigate('results')} className="hover:text-blue-600 transition-colors cursor-pointer font-medium">Result</button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

