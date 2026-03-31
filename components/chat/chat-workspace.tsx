"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";

import { LiveKitCall } from "@/components/chat/livekit-call";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ContactInfoDialog } from "@/components/chat/contact-info-dialog";
import { MessageComposer } from "@/components/chat/message-composer";
import { MessageList } from "@/components/chat/message-list";
import { MessageSearchPanel } from "@/components/chat/message-search-panel";
import type {
  ChatUser,
  ConversationListItem,
  SelectedConversation,
} from "@/components/chat/chat-types";
import { useChatWorkspaceStore } from "@/components/chat/use-chat-workspace-store";
import { WorkspaceNavigation } from "@/components/chat/workspace-navigation";
import { useChatRealtime } from "@/lib/supabase/client-realtime";

type ServerAction = (formData: FormData) => void | Promise<void>;

type ChatWorkspaceProps = {
  currentUser: ChatUser;
  contacts: ChatUser[];
  conversations: ConversationListItem[];
  selectedConversation: SelectedConversation | null;
  openDirectSessionAction: ServerAction;
  sendMessageAction: ServerAction;
  toggleMessageReactionAction: (messageId: string, emoji: string) => Promise<unknown>;
  archiveConversationAction: ServerAction;
  markConversationUnreadAction: ServerAction;
  toggleMuteConversationAction: ServerAction;
  clearConversationAction: ServerAction;
  deleteConversationAction: ServerAction;
  signOutAction: ServerAction;
  markReadAction?: (sessionId: string) => Promise<void>;
};

export function ChatWorkspace({
  currentUser,
  contacts,
  conversations,
  selectedConversation,
  openDirectSessionAction,
  sendMessageAction,
  toggleMessageReactionAction,
  archiveConversationAction,
  markConversationUnreadAction,
  toggleMuteConversationAction,
  clearConversationAction,
  deleteConversationAction,
  signOutAction,
  markReadAction,
}: ChatWorkspaceProps) {
  const [isAwaitingAiReply, setIsAwaitingAiReply] = useState(false);
  const {
    contacts: contactItems,
    conversationItems,
    activeConversation,
    detailsOpen,
    newMessageOpen,
    searchOpen,
    listQuery,
    messageSearchQuery,
    newMessageQuery,
    presenceByUserId,
    typingBySessionId,
    activeCall,
    initialize,
    setDetailsOpen,
    setNewMessageOpen,
    setSearchOpen,
    setListQuery,
    setMessageSearchQuery,
    setNewMessageQuery,
    setActiveCall,
    addOptimisticMessage,
    addOptimisticReaction,
  } = useChatWorkspaceStore();
  const activeSessionId = activeConversation?.sessionId;
  const { publishTypingState } = useChatRealtime(currentUser.id, activeSessionId);

  useEffect(() => {
    initialize({
      contacts,
      conversations,
      selectedConversation,
    });
  }, [contacts, conversations, initialize, selectedConversation]);

  useEffect(() => {
    if (!activeConversation || !markReadAction) return;

    const lastMessage =
      activeConversation.messages[activeConversation.messages.length - 1];

    if (lastMessage && lastMessage.senderId !== currentUser.id) {
      markReadAction(activeConversation.sessionId).catch(console.error);
    }
  }, [activeConversation, currentUser.id, markReadAction]);

  useEffect(() => {
    if (!activeConversation && detailsOpen) {
      setDetailsOpen(false);
    }
  }, [activeConversation, detailsOpen, setDetailsOpen]);

  useEffect(() => {
    if (!activeConversation && searchOpen) {
      setSearchOpen(false);
    }
  }, [activeConversation, searchOpen, setSearchOpen]);

  useEffect(() => {
    setIsAwaitingAiReply(false);
    setSearchOpen(false);
    setMessageSearchQuery("");
  }, [activeSessionId, setMessageSearchQuery, setSearchOpen]);

  useEffect(() => {
    const lastMessage =
      activeConversation?.messages[activeConversation.messages.length - 1];

    if (
      lastMessage &&
      activeConversation?.peer.isAi &&
      lastMessage.senderId === activeConversation.peer.id
    ) {
      setIsAwaitingAiReply(false);
    }
  }, [activeConversation]);

  const filteredConversations = useMemo(() => {
    const query = listQuery.trim().toLowerCase();

    if (!query) return conversationItems;

    return conversationItems.filter((conversation) =>
      [conversation.name, conversation.email, conversation.latestMessage]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [conversationItems, listQuery]);

  const newMessageContacts = useMemo(() => {
    const query = newMessageQuery.trim().toLowerCase();

    if (!query) return contactItems;

    return contactItems.filter((contact) =>
      [contact.name, contact.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [contactItems, newMessageQuery]);

  const totalUnreadCount = useMemo(
    () =>
      conversationItems.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0
      ),
    [conversationItems]
  );

  function isUserOnline(userId: string, isAi = false) {
    return isAi || Boolean(presenceByUserId[userId]);
  }

  const isPeerTyping =
    !!activeConversation &&
    (
      (typingBySessionId[activeConversation.sessionId] ?? []).includes(
        activeConversation.peer.id
      ) || (activeConversation.peer.isAi && isAwaitingAiReply)
    );

  async function handleStartCall() {
    if (!activeSessionId) return;

    try {
      const response = await fetch("/api/livekit/start-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const data = await response.json();

      if (response.ok && data.callId && data.roomName) {
        setActiveCall({ callId: data.callId, roomName: data.roomName });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleEndCall() {
    if (!activeCall) return;

    try {
      await fetch("/api/livekit/end-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: activeCall.callId }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setActiveCall(null);
    }
  }

  const handleSendMessage = async (formData: FormData) => {
    if (!activeConversation) return;

    const content = formData.get("content") as string;
    const hasAssets = formData.get("uploadedAssetsJson") !== "[]";
    if (!content.trim() && !hasAssets) return;

    // Trigger optimistic update (only if there's content to show)
    if (content.trim()) {
      addOptimisticMessage(activeConversation.sessionId, content, currentUser);
    }

    // Call server action
    try {
      await sendMessageAction(formData);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    // Trigger optimistic update
    addOptimisticReaction(messageId, emoji);

    // Call server action
    try {
      await toggleMessageReactionAction(messageId, emoji);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#f4f1ea] text-slate-900">
        <div className="flex h-full overflow-hidden bg-[#fbf9f3]">
          <WorkspaceNavigation
            currentUser={currentUser}
            totalUnreadCount={totalUnreadCount}
            signOutAction={signOutAction}
          />

          <ChatSidebar
            conversations={filteredConversations}
            activeConversation={activeConversation}
            isUserOnline={isUserOnline}
            listQuery={listQuery}
            onListQueryChange={setListQuery}
            newMessageContacts={newMessageContacts}
            newMessageQuery={newMessageQuery}
            onNewMessageQueryChange={setNewMessageQuery}
            openDirectSessionAction={openDirectSessionAction}
            archiveConversationAction={archiveConversationAction}
            markConversationUnreadAction={markConversationUnreadAction}
            toggleMuteConversationAction={toggleMuteConversationAction}
            clearConversationAction={clearConversationAction}
            deleteConversationAction={deleteConversationAction}
            onOpenDetails={() => {
              if (activeConversation) {
                setDetailsOpen(true);
              }
            }}
            newMessageOpen={newMessageOpen}
            onNewMessageOpenChange={setNewMessageOpen}
          />

          <section
            className={
              activeConversation
                ? "flex min-w-0 flex-1 flex-col overflow-hidden bg-[#fdfbf5]"
                : "hidden min-w-0 flex-1 flex-col overflow-hidden bg-[#fdfbf5] md:flex"
            }
          >
            {activeConversation ? (
              <>
                <ChatHeader
                  activeConversation={activeConversation}
                  isPeerTyping={isPeerTyping}
                  isUserOnline={isUserOnline}
                  onOpenSearch={() => setSearchOpen(true)}
                  onOpenDetails={() => setDetailsOpen(true)}
                  onStartCall={handleStartCall}
                  backHref="/chat"
                />

                <MessageList
                  activeConversation={activeConversation}
                  currentUser={currentUser}
                  toggleMessageReactionAction={handleToggleReaction}
                />

                <div className="border-t border-[#ece7dc] bg-white px-4 py-3 md:px-6">
                  <MessageComposer
                    key={activeConversation.sessionId}
                    isAiSession={activeConversation.peer.isAi}
                    sessionId={activeConversation.sessionId}
                    sendMessageAction={handleSendMessage}
                    onAwaitingAiReplyChange={setIsAwaitingAiReply}
                    onTypingStateChange={publishTypingState}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dcf5ee] text-[#2ea48c]">
                    <MessageCircle className="size-7" />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                    Open a conversation
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Pick a teammate from the list to load the full workspace
                    view and start sending messages.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <ContactInfoDialog
        conversation={activeConversation}
        open={detailsOpen && Boolean(activeConversation)}
        onOpenChange={setDetailsOpen}
      />

      {activeConversation ? (
        <MessageSearchPanel
          currentUserId={currentUser.id}
          messages={activeConversation.messages}
          open={searchOpen}
          query={messageSearchQuery}
          onOpenChange={setSearchOpen}
          onQueryChange={setMessageSearchQuery}
        />
      ) : null}

      {activeCall ? (
        <LiveKitCall
          roomName={activeCall.roomName}
          onDisconnected={handleEndCall}
        />
      ) : null}
    </>
  );
}
