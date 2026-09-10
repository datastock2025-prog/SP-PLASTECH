import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Plus,
  Edit2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Code,
  Sliders,
} from 'lucide-react';
import { NotificationTemplate } from '../../types/admin';
import { mockNotificationTemplates } from '../../data/mockAdminData';

interface AdminNotificationsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminNotificationsView: React.FC<AdminNotificationsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockNotificationTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<NotificationTemplate | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleToggleChannel = (templateId: string, channel: 'email' | 'sms' | 'whatsapp' | 'inApp') => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === templateId) {
          const channels = {
            ...t.channels,
            [channel]: !t.channels[channel],
          };
          return { ...t, channels };
        }
        return t;
      })
    );
    showToast(`Updated notification delivery channels for "${selectedTemplate?.templateName}".`);
  };

  const handleSendTestDispatch = (template: NotificationTemplate) => {
    showToast(`Test dispatch of "${template.templateName}" sent to designated recipient roles.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setTemplates((prev) => prev.map((t) => (t.id === editForm.id ? editForm : t)));
    setIsEditing(false);
    showToast(`Template "${editForm.templateName}" updated successfully.`);
  };

  const getChannelCount = (t: NotificationTemplate) => {
    let count = 0;
    if (t.channels.email) count++;
    if (t.channels.whatsapp) count++;
    if (t.channels.sms) count++;
    if (t.channels.inApp) count++;
    return count;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Bell className="w-4 h-4 text-[#0F8B8D]" />
            <span>Operational Event Dispatch &amp; Alert Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Notification Templates &amp; Delivery Routing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-channel triggers for machine breakdown alarms, PO approval escalations, and raw material safety thresholds.
          </p>
        </div>

        {selectedTemplate && (
          <button
            onClick={() => handleSendTestDispatch(selectedTemplate)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            Test Send Selected
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1 mb-2">
            Event Triggers ({templates.length})
          </div>

          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            return (
              <div
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplateId(tpl.id);
                  setIsEditing(false);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#0F8B8D]/10 border-[#0F8B8D] shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    {tpl.module}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{getChannelCount(tpl)} Channels</span>
                </div>

                <h3 className="font-bold text-xs text-slate-900 mt-2">{tpl.templateName}</h3>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">{tpl.triggerEvent}</div>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {tpl.channels.email && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      <Mail className="w-3 h-3 text-blue-500" /> Email
                    </span>
                  )}
                  {tpl.channels.whatsapp && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      <MessageSquare className="w-3 h-3 text-emerald-500" /> WhatsApp
                    </span>
                  )}
                  {tpl.channels.sms && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      <Smartphone className="w-3 h-3 text-purple-500" /> SMS
                    </span>
                  )}
                  {tpl.channels.inApp && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      <Bell className="w-3 h-3 text-amber-500" /> In-App
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Template Detail & Dynamic Placeholders Inspector */}
        {selectedTemplate && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h2 className="font-bold text-base text-slate-900">{selectedTemplate.templateName}</h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Trigger: <span className="font-mono text-slate-700 font-semibold">{selectedTemplate.triggerEvent}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditForm(selectedTemplate);
                      setIsEditing(!isEditing);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                    {isEditing ? 'Cancel Edit' : 'Edit Template'}
                  </button>
                </div>
              </div>

              {/* Delivery Channel Toggles */}
              <div className="mt-4 pt-2">
                <label className="text-xs font-semibold text-slate-700 block mb-2">Active Transmission Channels:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { key: 'email', label: 'Email', icon: Mail },
                      { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                      { key: 'sms', label: 'SMS', icon: Smartphone },
                      { key: 'inApp', label: 'In-App Alert', icon: Bell },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => {
                    const isActive = selectedTemplate.channels[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleToggleChannel(selectedTemplate.id, key)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          isActive
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Body */}
              {isEditing && editForm ? (
                <form onSubmit={handleSaveEdit} className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subject Header (For Email/Push)</label>
                    <input
                      type="text"
                      value={editForm.emailSubject}
                      onChange={(e) => setEditForm({ ...editForm, emailSubject: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Message Content (Markdown &amp; Variables Supported)</label>
                    <textarea
                      rows={6}
                      value={editForm.messageBody}
                      onChange={(e) => setEditForm({ ...editForm, messageBody: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] text-white font-semibold shadow-sm"
                    >
                      Save Template
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Rendered Subject
                    </span>
                    <div className="text-xs font-semibold text-slate-900 mt-1">{selectedTemplate.emailSubject}</div>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap shadow-inner leading-relaxed">
                    {selectedTemplate.messageBody}
                  </div>
                </div>
              )}

              {/* Dynamic Placeholder Variables Tokens */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  Available Context Placeholders
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.availablePlaceholders.map((v) => (
                    <span
                      key={v}
                      className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
