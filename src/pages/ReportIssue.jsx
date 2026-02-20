import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createIssue } from '../services/issueService';
import { ToastContext } from '../App';

const categories = [
  { value: 'Infrastructure', icon: '🏗️', desc: 'Roads, buildings, utilities' },
  { value: 'Environment', icon: '🌳', desc: 'Parks, pollution, wildlife' },
  { value: 'Safety', icon: '🛡️', desc: 'Public safety concerns' },
  { value: 'Community', icon: '🤝', desc: 'Neighborhood issues' },
  { value: 'Other', icon: '📋', desc: 'Other concerns' }
];

const ReportIssue = () => {
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    reporterName: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.reporterName.trim()) {
      newErrors.reporterName = 'Your name is required';
    } else if (formData.reporterName.length > 100) {
      newErrors.reporterName = 'Name must be less than 100 characters';
    }
    
    if (formData.location && formData.location.length > 200) {
      newErrors.location = 'Location must be less than 200 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      await createIssue(formData);
      
      showToast('Issue reported successfully! Thank you for contributing.', 'success');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        reporterName: ''
      });
      setStep(1);
      
      // Navigate without refresh
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
      
    } catch (err) {
      showToast(err.message || 'Failed to submit issue. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.category) {
      setErrors({ category: 'Please select a category' });
      return;
    }
    if (step === 2) {
      if (!formData.title.trim()) {
        setErrors({ title: 'Title is required' });
        return;
      }
      if (!formData.description.trim()) {
        setErrors({ description: 'Description is required' });
        return;
      }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-4 transition-colors group">
          <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="nature-gradient rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <svg viewBox="0 0 200 200" fill="currentColor">
              <path d="M100,10 Q120,50 100,90 Q80,130 100,170 Q120,130 140,90 Q160,50 140,30 Q120,10 100,10" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">Report an Issue</h1>
            </div>
            <p className="text-emerald-100 text-lg">
              Help build a better community by reporting issues that need attention
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Category', 'Details', 'Contact'].map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step > i + 1 ? 'bg-emerald-500 text-white' :
                step === i + 1 ? 'bg-emerald-500 text-white ring-4 ring-emerald-200' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step > i + 1 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= i + 1 ? 'text-emerald-700' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < 2 && (
                <div className={`w-16 md:w-24 h-1 mx-4 rounded ${step > i + 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="nature-card rounded-3xl shadow-xl p-8">
        {/* Step 1: Category */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-2">What type of issue is this?</h2>
            <p className="text-gray-500 mb-6">Select the category that best describes your concern</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                    formData.category === cat.value
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <h3 className={`font-semibold ${formData.category === cat.value ? 'text-emerald-700' : 'text-gray-800'}`}>
                        {cat.value}
                      </h3>
                      <p className="text-sm text-gray-500">{cat.desc}</p>
                    </div>
                    {formData.category === cat.value && (
                      <svg className="w-6 h-6 text-emerald-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="mt-4 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errors.category}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Describe the issue</h2>
            <p className="text-gray-500 mb-6">Provide details to help us understand and address the problem</p>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Fallen tree blocking walking trail"
                  className="nature-input"
                />
                {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title}</p>}
                <p className="mt-2 text-xs text-gray-400">{formData.title.length}/200</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail. Include any relevant information that would help resolve it."
                  className="nature-input resize-none"
                />
                {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
                <p className="mt-2 text-xs text-gray-400">{formData.description.length}/2000</p>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                  Location <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Central Park, near the fountain"
                    className="nature-input pl-12"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your Information</h2>
            <p className="text-gray-500 mb-6">Let us know who's reporting this issue</p>
            
            <div className="mb-6">
              <label htmlFor="reporterName" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="reporterName"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="nature-input pl-12"
                />
              </div>
              {errors.reporterName && <p className="mt-2 text-sm text-red-600">{errors.reporterName}</p>}
            </div>

            {/* Summary */}
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review Your Report
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-gray-500 w-24">Category:</span>
                  <span className="text-gray-800 font-medium">{formData.category || '-'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">Title:</span>
                  <span className="text-gray-800 font-medium">{formData.title || '-'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">Location:</span>
                  <span className="text-gray-800">{formData.location || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={step === 1 ? () => navigate('/') : prevStep}
            className="nature-btn-secondary"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 3 ? (
            <button type="button" onClick={nextStep} className="nature-btn-primary">
              Continue
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="nature-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center">
                  Submit Report
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReportIssue;
