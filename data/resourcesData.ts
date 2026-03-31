interface ResourceItem {
  title: string
  description: string
  url: string
}

interface ResourceCategory {
  title: string
  icon: string
  items: ResourceItem[]
}

const resourcesData: ResourceCategory[] = [
  {
    title: '操作系统 & 网络',
    icon: '📚',
    items: [
      {
        title: '零拷贝技术',
        description:
          '以文件传输为切入点，讲解 DMA 技术、mmap+write、sendfile 等零拷贝实现方案，以及如何根据文件大小选择合适的传输方式。',
        url: 'https://xiaolincoding.com/os/8_network_system/zero_copy.html',
      },
      {
        title: 'I/O 多路复用：select/poll/epoll',
        description:
          '从 Socket 模型出发，逐步介绍多进程、多线程和 I/O 多路复用方式，重点讲解 select、poll、epoll 三者的原理与区别。',
        url: 'https://xiaolincoding.com/os/8_network_system/selete_poll_epoll.html',
      },
      {
        title: '高性能网络模式：Reactor 和 Proactor',
        description:
          '详解 Reactor 和 Proactor 的设计原理，涵盖三种经典 Reactor 方案，理解 Redis、Nginx、Netty 等软件的网络架构设计。',
        url: 'https://xiaolincoding.com/os/8_network_system/reactor.html',
      },
      {
        title: '一致性哈希',
        description:
          '介绍一致性哈希算法如何解决分布式系统中节点扩缩容时的数据迁移问题，以及虚拟节点机制优化均衡性。',
        url: 'https://xiaolincoding.com/os/8_network_system/hash.html',
      },
    ],
  },
]

export default resourcesData
