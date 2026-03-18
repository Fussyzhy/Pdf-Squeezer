import { createRouter, createWebHashHistory } from 'vue-router'
import { TOOL_CONFIGS } from '@/views/tool-config'

const workspaceComponent = () => import('@/views/PdfWorkspace.vue')

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/toolbox',
      name: 'Toolbox',
      component: () => import('@/views/ToolboxView.vue'),
    },
    {
      path: '/editor',
      name: 'Editor',
      component: () => import('@/views/PdfEditorView.vue'),
    },
    ...TOOL_CONFIGS.map((tool) => ({
      path: tool.path,
      name: tool.id,
      component: workspaceComponent,
      props: {
        tool: tool.id,
      },
    })),
  ],
})

export default router
