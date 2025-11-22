#!/usr/bin/env python
import sys
sys.path.insert(0, '/root/app')
from app.init_db import seed
seed()
