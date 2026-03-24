-- 챗봇 대화 로그 (로그인 사용자만 저장). 관리자 조회용.
-- 보관: 30일 지난 대화는 앱 크론(/api/chatbot/prune) 또는 서비스 롤로 삭제.

create table if not exists public.chatbot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  locale text not null default 'ko',
  user_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chatbot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chatbot_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  used_model boolean,
  created_at timestamptz not null default now()
);

create index if not exists chatbot_conversations_user_updated_idx
  on public.chatbot_conversations (user_id, updated_at desc);

create index if not exists chatbot_messages_conversation_created_idx
  on public.chatbot_messages (conversation_id, created_at asc);

create index if not exists chatbot_conversations_updated_idx
  on public.chatbot_conversations (updated_at);

alter table public.chatbot_conversations enable row level security;
alter table public.chatbot_messages enable row level security;

-- 관리자 여부 (이름 충돌 방지)
create or replace function public.gm_chatbot_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- conversations
create policy "chatbot_conv_select_own"
  on public.chatbot_conversations for select
  using (auth.uid() = user_id);

create policy "chatbot_conv_select_admin"
  on public.chatbot_conversations for select
  using (public.gm_chatbot_is_admin());

create policy "chatbot_conv_insert_own"
  on public.chatbot_conversations for insert
  with check (auth.uid() = user_id);

create policy "chatbot_conv_update_own"
  on public.chatbot_conversations for update
  using (auth.uid() = user_id);

-- messages
create policy "chatbot_msg_insert_own_conv"
  on public.chatbot_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chatbot_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "chatbot_msg_select_admin"
  on public.chatbot_messages for select
  using (public.gm_chatbot_is_admin());

comment on table public.chatbot_conversations is '챗봇 대화 세션 (사용자별)';
comment on table public.chatbot_messages is '챗봇 메시지 로그; 30일 후 삭제 권장';
