"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Filter,
  Trash2,
  Mail,
  Briefcase,
  DollarSign,
  Settings,
  TestTube,
} from "lucide-react"
import axios from "axios"
import config from "@/config"
import { useAuth } from "@/contexts/AuthContext"
import { useNotificationSettingsSafe } from "@/hooks/useNotificationSettingsSafe"
import { useTranslation } from "react-i18next";
interface NotificationType {
  id: string
  name: string
  description: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  data?: any
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { t } = useTranslation();
  const navigate = useNavigate()
  const { playNotificationSound, settings } = useNotificationSettingsSafe()

  // State management - Initialize as empty arrays
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0)

  // Filter states
  const [selectedType, setSelectedType] = useState<string>("")
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(20)

  // Test notification sound
  const testNotificationSound = () => {
    console.log("Testing notification sound, settings:", settings)
    playNotificationSound()
  }

  // Fetch notification types
  const fetchNotificationTypes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`${config.API_BASE_URL}/notifications/types`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotificationTypes(response.data?.data || [])
    } catch (error) {
      console.error("Failed to fetch notification types:", error)
      setNotificationTypes([]) // Ensure it's always an array
    }
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`${config.API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const newUnreadCount = response.data?.count || 0

      // Play sound if unread count increased (new notification)
      if (newUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
        console.log("New notification detected, playing sound")
        playNotificationSound()
      }

      setPreviousUnreadCount(unreadCount)
      setUnreadCount(newUnreadCount)
    } catch (error) {
      console.error("Failed to fetch unread count:", error)
    }
  }

  // Fetch notifications
  const fetchNotifications = async () => {
  setLoading(true)
  try {
    const token = localStorage.getItem("token")
    const params = new URLSearchParams()

    if (selectedType) params.append("type", selectedType)
    if (showOnlyUnread) params.append("is_read", "false")
    params.append("per_page", perPage.toString())

    const response = await axios.get(`${config.API_BASE_URL}/notifications?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // Fix: Access nested notifications array
    const fetchedNotifications = response.data?.data?.notifications || []
    setNotifications(Array.isArray(fetchedNotifications) ? fetchedNotifications : [])
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    setNotifications([]) // Ensure it's always an array
  } finally {
    setLoading(false)
  }
}


  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    setLoadingAction(notificationId)
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `${config.API_BASE_URL}/notifications/${notificationId}/mark-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      // Update local state
      setNotifications((prev) =>
        Array.isArray(prev)
          ? prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
          : [],
      )

      // Update unread count
      fetchUnreadCount()
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    } finally {
      setLoadingAction(null)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    setLoadingAction("mark-all")
    try {
      const token = localStorage.getItem("token")
      const params = selectedType ? `?type=${selectedType}` : ""

      await axios.post(
        `${config.API_BASE_URL}/notifications/mark-all-read${params}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      // Update local state
      setNotifications((prev) => (Array.isArray(prev) ? prev.map((notif) => ({ ...notif, is_read: true })) : []))

      // Update unread count
      fetchUnreadCount()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    } finally {
      setLoadingAction(null)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    setLoadingAction(notificationId)
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${config.API_BASE_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Remove from local state
      setNotifications((prev) => (Array.isArray(prev) ? prev.filter((notif) => notif.id !== notificationId) : []))

      // Update unread count
      fetchUnreadCount()
    } catch (error) {
      console.error("Failed to delete notification:", error)
    } finally {
      setLoadingAction(null)
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_application":
        return <Briefcase className="w-5 h-5 text-blue-500" />
      case "payment":
        return <DollarSign className="w-5 h-5 text-green-500" />
      case "message":
        return <Mail className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (!user) return

    fetchNotificationTypes()
    fetchUnreadCount()
  }, [user])

  // Fetch notifications when filters change
  useEffect(() => {
    if (!user) return

    fetchNotifications()
  }, [user, selectedType, showOnlyUnread, currentPage])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [user, unreadCount])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Please log in to view notifications
      </div>
    )
  }

  // Ensure notifications is always an array before using array methods
  const notificationsArray = Array.isArray(notifications) ? notifications : []
  const hasUnreadNotifications = notificationsArray.some((n) => !n.is_read)

  return (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
              <ArrowLeft className="w-5 h-5 mr-2" /> {t("notifications.back")}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className="w-6 h-6 mr-2 text-red-500" />
                {t("notifications.title")}
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">{unreadCount}</span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">{t("notifications.subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={testNotificationSound} className="...">
              <TestTube className="..." />
              {t("notifications.test_sound")}
            </button>

            <button onClick={() => navigate("/notification-settings")} className="...">
              <Settings className="..." />
              {t("notifications.settings")}
            </button>

            <button onClick={() => setShowFilters(!showFilters)} className="...">
              <Filter className="..." />
              {t("notifications.filters")}
            </button>

            {hasUnreadNotifications && (
              <button
                onClick={markAllAsRead}
                disabled={loadingAction === "mark-all"}
                className="..."
              >
                <CheckCheck className="..." />
                {loadingAction === "mark-all"
                  ? t("notifications.marking_all")
                  : t("notifications.mark_all_read")}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="...">
            <label className="...">{t("notifications.type")}</label>
            ...
            <label htmlFor="unread-only" className="...">
              {t("notifications.show_only_unread")}
            </label>
            ...
            <button className="...">{t("notifications.clear_filters")}</button>
          </div>
        )}
      </div>
    </div>

    {/* Content */}
    <main className="...">
      {loading ? (
        <div className="...">{t("notifications.loading")}</div>
      ) : notificationsArray.length === 0 ? (
        <div className="...">
          <Bell className="..." />
          <h3 className="...">{t("notifications.no_notifications")}</h3>
          <p className="...">
            {selectedType || showOnlyUnread
              ? t("notifications.no_filtered")
              : t("notifications.no_new")}
          </p>
        </div>
      )  : (
          <div className="space-y-4">
            {notificationsArray.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
                  notification.is_read ? "border-l-gray-200" : "border-l-red-500 bg-red-50/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.is_read && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                      </div>

                      <p className="text-gray-600 mb-2">{notification.message}</p>

                      <div className="flex items-center text-sm text-gray-500">
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs mr-3">
                          {notification.type.replace("_", " ")}
                        </span>
                        <span>
                          {new Date(notification.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        disabled={loadingAction === notification.id}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(notification.id)}
                      disabled={loadingAction === notification.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      {loadingAction === notification.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
