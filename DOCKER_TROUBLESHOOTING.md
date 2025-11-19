# Docker Installation Troubleshooting for AlmaLinux

## Issue: Docker service fails to start after installation

The packages install successfully but `systemctl start docker` fails.

## Diagnostic Steps

### 1. Check Docker service status
```bash
systemctl status docker.service
```

### 2. View detailed error logs
```bash
journalctl -xeu docker.service --no-pager | tail -50
```

### 3. Check for conflicting services
```bash
# Check if podman is running (conflicts with Docker)
systemctl status podman 2>/dev/null
systemctl stop podman 2>/dev/null || true
systemctl disable podman 2>/dev/null || true
```

## Common Fixes

### Fix 1: SELinux Issues
```bash
# Check SELinux status
getenforce

# If SELinux is causing issues, try:
setenforce 0  # Temporarily disable

# Or configure SELinux for Docker:
setsebool -P container_manage_cgroup true
```

### Fix 2: cgroup v2 Compatibility
AlmaLinux 10 uses cgroup v2 by default. Docker needs proper configuration:

```bash
# Create Docker daemon configuration
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF

# Reload and restart
systemctl daemon-reload
systemctl restart docker
```

### Fix 3: Firewalld Conflicts
```bash
# Stop firewalld temporarily
systemctl stop firewalld

# Try starting Docker
systemctl start docker

# If it works, configure firewalld properly:
systemctl start firewalld
firewall-cmd --permanent --zone=trusted --add-interface=docker0
firewall-cmd --permanent --zone=FedoraServer --add-masquerade
firewall-cmd --reload
```

### Fix 4: Clean Install
If all else fails, do a complete clean install:

```bash
# Stop and remove everything
systemctl stop docker docker.socket containerd
dnf remove -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
rm -rf /var/lib/docker /var/lib/containerd
rm -f /etc/yum.repos.d/docker-ce.repo

# Reinstall with proper configuration
dnf install -y dnf-plugins-core
dnf config-manager --add-repo=https://download.docker.com/linux/rhel/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Configure before starting
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
EOF

# Start Docker
systemctl daemon-reload
systemctl enable docker
systemctl start docker
```

### Fix 5: Check Kernel Modules
```bash
# Ensure required kernel modules are loaded
modprobe overlay
modprobe br_netfilter

# Make persistent
cat > /etc/modules-load.d/docker.conf <<EOF
overlay
br_netfilter
EOF

# Configure sysctl
cat > /etc/sysctl.d/99-docker.conf <<EOF
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF

sysctl --system
```

## Verification

After applying fixes, verify Docker is working:

```bash
# Check service status
systemctl status docker

# Test Docker
docker run --rm hello-world

# Check Docker info
docker info
```

## Alternative: Use Podman Instead

If Docker continues to fail, AlmaLinux works great with Podman (Docker-compatible):

```bash
# Install Podman
dnf install -y podman podman-docker

# Podman is drop-in compatible with Docker
# Just use 'docker' commands and they work with Podman

# Test
docker run --rm hello-world
```

## Need More Help?

Run this diagnostic script and share the output:

```bash
cat > /tmp/docker-diag.sh <<'EOF'
#!/bin/bash
echo "=== OS Info ==="
cat /etc/os-release | grep -E "NAME|VERSION"

echo -e "\n=== Kernel ==="
uname -r

echo -e "\n=== SELinux ==="
getenforce

echo -e "\n=== cgroup ==="
mount | grep cgroup

echo -e "\n=== Docker Version ==="
docker --version 2>&1

echo -e "\n=== Docker Service Status ==="
systemctl status docker --no-pager

echo -e "\n=== Docker Logs (last 30 lines) ==="
journalctl -xeu docker.service --no-pager | tail -30

echo -e "\n=== Docker Daemon Config ==="
cat /etc/docker/daemon.json 2>/dev/null || echo "No daemon.json found"

echo -e "\n=== Kernel Modules ==="
lsmod | grep -E "overlay|br_netfilter"
EOF

chmod +x /tmp/docker-diag.sh
/tmp/docker-diag.sh
```

Send the output for further assistance.
