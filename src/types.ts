import { RenderFunction } from 'vue'

export interface MenuItem {
  name: string
  path: string
  icon: RenderFunction
}
