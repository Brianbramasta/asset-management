'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Settings, User, Bell, Shield, Database, Palette, Save, Mail, Send, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    securityAlerts: true,
  })

  // Email testing state
  const [emailTest, setEmailTest] = useState({
    testEmail: user?.email || '',
    notificationTitle: 'Test Notification',
    notificationMessage: 'This is a test notification from ManajemenAset System.',
    securityAlertType: 'Suspicious Login Activity',
    securityDetails: 'A login attempt was detected from a new device or location.',
  })

  // Load notification preferences on mount
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      if (!token) return
      
      try {
        const response = await fetch('/api/user/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setNotifications(result.preferences)
          }
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error)
      }
    }

    loadNotificationPreferences()
  }, [token])

  const handleSaveProfile = async () => {
    // Clear previous errors
    setErrors({})
    
    // Client-side validation
    const newErrors: Record<string, string> = {}
    
    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (profileData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors below.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh user data in context
        await refreshUser()
        toast({
          title: 'Profile Updated',
          description: 'Your profile information has been updated successfully.',
        })
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    // Clear previous errors
    setErrors({})
    
    // Client-side validation
    const newErrors: Record<string, string> = {}
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long'
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation is required'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors below.',
        variant: 'destructive',
      })
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      })

      const result = await response.json()

      if (result.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast({
          title: 'Password Changed',
          description: 'Your password has been changed successfully.',
        })
      } else {
        throw new Error(result.error || 'Failed to change password')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notifications),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Settings Saved',
          description: 'Notification preferences have been updated successfully.',
        })
      } else {
        throw new Error(result.error || 'Failed to save notification settings')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save notification settings'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async (type: 'test' | 'notification' | 'security') => {
    if (!emailTest.testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      let payload: any = {
        type,
        email: emailTest.testEmail,
      }

      if (type === 'notification') {
        payload.title = emailTest.notificationTitle
        payload.message = emailTest.notificationMessage
      } else if (type === 'security') {
        payload.alertType = emailTest.securityAlertType
        payload.details = emailTest.securityDetails
      }

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Email Sent',
          description: `${type === 'test' ? 'Test' : type === 'notification' ? 'Notification' : 'Security alert'} email sent successfully!`,
        })
      } else {
        throw new Error(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Email sending error:', error)
      toast({
        title: 'Error',
        description: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'system', label: 'Sistem', icon: Database },
    { id: 'appearance', label: 'Tampilan', icon: Palette },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-600">Kelola pengaturan akun dan preferensi Anda</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Settings className="w-5 h-5 mr-2" />
                Pengaturan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#0EB6B4]/10 text-[#187F7E] border-r-2 border-[#187F7E]'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>
                  Perbarui informasi profil akun dan alamat email Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Depan
                    </label>
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => {
                        setProfileData({ ...profileData, firstName: e.target.value })
                        if (errors.firstName) {
                          setErrors({ ...errors, firstName: '' })
                        }
                      }}
                      className={errors.firstName ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Belakang
                    </label>
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => {
                        setProfileData({ ...profileData, lastName: e.target.value })
                        if (errors.lastName) {
                          setErrors({ ...errors, lastName: '' })
                        }
                      }}
                      className={errors.lastName ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Email
                  </label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => {
                      setProfileData({ ...profileData, email: e.target.value })
                      if (errors.email) {
                        setErrors({ ...errors, email: '' })
                      }
                    }}
                    className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Pengguna
                  </label>
                  <Input
                    value={profileData.username}
                    onChange={(e) => {
                      setProfileData({ ...profileData, username: e.target.value })
                      if (errors.username) {
                        setErrors({ ...errors, username: '' })
                      }
                    }}
                    className={errors.username ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ubah Kata Sandi</CardTitle>
                  <CardDescription>
                    Pastikan akun Anda menggunakan kata sandi yang panjang dan acak untuk tetap aman.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kata Sandi Saat Ini
                    </label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        if (errors.currentPassword) {
                          setErrors({ ...errors, currentPassword: '' })
                        }
                      }}
                      className={errors.currentPassword ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {errors.currentPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kata Sandi Baru
                    </label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                        if (errors.newPassword) {
                          setErrors({ ...errors, newPassword: '' })
                        }
                      }}
                      className={errors.newPassword ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {errors.newPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">Minimal 6 karakter</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konfirmasi Kata Sandi
                    </label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        if (errors.confirmPassword) {
                          setErrors({ ...errors, confirmPassword: '' })
                        }
                      }}
                      className={errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleChangePassword} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Autentikasi Dua Faktor</CardTitle>
                  <CardDescription>
                    Tambahkan keamanan tambahan ke akun Anda menggunakan autentikasi dua faktor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Aplikasi Autentikator</h4>
                      <p className="text-sm text-gray-600">Gunakan aplikasi autentikator untuk menghasilkan kode</p>
                    </div>
                    <Button variant="outline">Aktifkan</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferensi Notifikasi</CardTitle>
                  <CardDescription>
                    Pilih notifikasi apa yang ingin Anda terima dan bagaimana caranya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {key === 'emailNotifications' && 'Terima notifikasi email untuk pembaruan penting'}
                            {key === 'pushNotifications' && 'Terima notifikasi push di perangkat Anda'}
                            {key === 'weeklyReports' && 'Dapatkan laporan ringkasan mingguan melalui email'}
                            {key === 'securityAlerts' && 'Terima peringatan untuk kejadian terkait keamanan'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#187F7E]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#187F7E]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Menyimpan...' : 'Simpan Preferensi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Email Testing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Test Email Configuration
                  </CardTitle>
                  <CardDescription>
                    Test your email settings by sending sample emails.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={emailTest.testEmail}
                      onChange={(e) => setEmailTest({ ...emailTest, testEmail: e.target.value })}
                      placeholder="Enter email address for testing"
                    />
                  </div>

                  {/* Test Email Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Basic Test Email */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-3">
                        <Send className="w-5 h-5 text-[#187F7E] mr-2" />
                        <h4 className="font-medium text-gray-900">Basic Test</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Send a simple test email to verify email configuration.
                      </p>
                      <Button
                        onClick={() => handleSendTestEmail('test')}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        {loading ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </div>

                    {/* Notification Email */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-3">
                        <Bell className="w-5 h-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Notification</h4>
                      </div>
                      <div className="space-y-2 mb-4">
                        <Input
                          placeholder="Notification title"
                          value={emailTest.notificationTitle}
                          onChange={(e) => setEmailTest({ ...emailTest, notificationTitle: e.target.value })}
                          className="text-xs"
                        />
                        <Textarea
                          placeholder="Notification message"
                          value={emailTest.notificationMessage}
                          onChange={(e) => setEmailTest({ ...emailTest, notificationMessage: e.target.value })}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                      <Button
                        onClick={() => handleSendTestEmail('notification')}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        {loading ? 'Sending...' : 'Send Notification'}
                      </Button>
                    </div>

                    {/* Security Alert */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Security Alert</h4>
                      </div>
                      <div className="space-y-2 mb-4">
                        <Input
                          placeholder="Alert type"
                          value={emailTest.securityAlertType}
                          onChange={(e) => setEmailTest({ ...emailTest, securityAlertType: e.target.value })}
                          className="text-xs"
                        />
                        <Textarea
                          placeholder="Alert details"
                          value={emailTest.securityDetails}
                          onChange={(e) => setEmailTest({ ...emailTest, securityDetails: e.target.value })}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                      <Button
                        onClick={() => handleSendTestEmail('security')}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        {loading ? 'Sending...' : 'Send Security Alert'}
                      </Button>
                    </div>
                  </div>

                  {/* Email Status Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Email Service Status</h4>
                        <p className="text-sm text-blue-700">
                          Email service is configured with Mailtrap. Test emails will be sent using the configured SMTP settings.
                        </p>
                        <div className="mt-2 text-xs text-blue-600">
                          <p>Service: Mailtrap Email API</p>
                          <p>Provider: ManajemenAset System</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Sistem</CardTitle>
                  <CardDescription>
                    Lihat informasi sistem dan kelola pengaturan sistem.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Versi Aplikasi</h4>
                      <p className="text-sm text-gray-600">v1.0.0</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Status Database</h4>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Terhubung
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Backup Terakhir</h4>
                      <p className="text-sm text-gray-600">Hari ini pukul 3:00 AM</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Penyimpanan Terpakai</h4>
                      <p className="text-sm text-gray-600">2.3 GB / 10 GB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user?.role === 'ADMIN' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pemeliharaan Sistem</CardTitle>
                    <CardDescription>
                      Alat administratif untuk pemeliharaan sistem.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="w-4 h-4 mr-2" />
                        Ekspor Database
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="w-4 h-4 mr-2" />
                        Bersihkan Cache
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                        <Database className="w-4 h-4 mr-2" />
                        Reset Sistem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Tampilan</CardTitle>
                <CardDescription>
                  Sesuaikan tampilan aplikasi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Tema</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="relative">
                        <input type="radio" name="theme" id="light" className="sr-only peer" defaultChecked />
                        <label htmlFor="light" className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-[#187F7E] peer-checked:bg-[#0EB6B4]/10">
                          <div className="w-8 h-8 bg-white border border-gray-300 rounded mb-2"></div>
                          <span className="text-sm font-medium">Terang</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input type="radio" name="theme" id="dark" className="sr-only peer" />
                        <label htmlFor="dark" className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-[#187F7E] peer-checked:bg-[#0EB6B4]/10">
                          <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded mb-2"></div>
                          <span className="text-sm font-medium">Gelap</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input type="radio" name="theme" id="auto" className="sr-only peer" />
                        <label htmlFor="auto" className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-[#187F7E] peer-checked:bg-[#0EB6B4]/10">
                          <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-800 border border-gray-300 rounded mb-2"></div>
                          <span className="text-sm font-medium">Otomatis</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Perubahan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}