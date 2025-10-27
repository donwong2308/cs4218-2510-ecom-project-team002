# JMeter Installation for Stress Testing

## Installation Details

**Date:** October 27, 2025  
**Version:** Apache JMeter 5.6.3  
**Installation Path:** `C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3`

## Components Installed

### Core
- Apache JMeter 5.6.3
- JMeter Plugins Manager (command-line and GUI)
- Command Runner 2.3

### Essential Plugins for Stress Testing

#### Thread Groups (Critical for Stress Testing)
- ✅ **Stepping Thread Group** - For progressive stress testing (100→500 users)
- ✅ **Custom Thread Groups** - For spike stress patterns (50→500 instant)
- ✅ **Ultimate Thread Group** - Additional thread group control

#### Listeners & Reporting
- ✅ **Backend Listener (HTML Dashboard)** - For failure visualization
- ✅ **Active Threads Over Time** - Monitor thread behavior under stress
- ✅ **Response Times Over Time** - Track degradation
- ✅ **Transactions Per Second** - Monitor throughput collapse
- ✅ **Summary Report** - Failure statistics
- ✅ **Aggregate Report** - Error rate analysis
- ✅ **PerfMon** - Server monitoring (CPU, memory exhaustion)

#### Data & Configuration
- ✅ **CSV Data Set Config** - For test data (users, products)
- ✅ **Random CSV Data Set** - Random data selection
- ✅ **Extended CSV Dataset** - Advanced CSV handling

#### Additional Utilities
- ✅ **JSON Extractors** - Extract tokens from auth responses
- ✅ **WebSocket Samplers** - If needed for real-time features
- ✅ **Graphs Basic/Additional/Composite** - Failure progression graphs
- ✅ **Functions** - Custom JMeter functions
- ✅ **Synthesis** - Results processing

## Installation Commands Used

```powershell
# 1. Verify JMeter Version
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin
.\jmeter.bat --version
# Output: Apache JMeter 5.6.3

# 2. Download Plugins Manager
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\lib\ext
Invoke-WebRequest -Uri "https://jmeter-plugins.org/get/" -OutFile "jmeter-plugins-manager.jar"

# 3. Download Command Runner
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\lib
Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/kg/apc/cmdrunner/2.3/cmdrunner-2.3.jar" -OutFile "cmdrunner-2.3.jar"

# 4. Install All Plugins (except incompatible ones)
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin
java -jar ..\lib\cmdrunner-2.3.jar --tool org.jmeterplugins.repository.PluginManagerCMD install-all-except jpgc-hadoop,jpgc-oauth,ulp-jmeter-autocorrelator-plugin,ulp-jmeter-videostreaming-plugin
```

## Verification

✅ JMeter GUI launches successfully  
✅ Plugins Manager accessible  
✅ All critical stress testing plugins installed  
✅ Thread groups available for stress scenarios  
✅ Listeners configured for failure tracking  

## Launch JMeter

```powershell
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin
./jmeter.bat
```

Or double-click `jmeter.bat` in the bin directory.

## Next Steps

Task 4: Design detailed stress testing scenarios with specific configurations:
- Progressive Stress: 100→500 users, +50 every 2min
- Spike Stress: 50→500 users INSTANT
- Extreme Stress: 400 users sustained for 5min
- Recovery Test: Stress→failure→recovery

## Notes

- Installation focused on **stress testing only** (NOT load/performance testing)
- Plugins selected for **failure detection and breaking point discovery**
- All visualizations configured to show **failure progression**, not optimization
- Server monitoring available via PerfMon to track resource exhaustion (CPU/memory at 100%)
