#!/bin/bash
awk '
/const handleLogout/ {
    print "  useEffect(() => {"
    print "    if (!userData?.id || userData?.role !== \"teacher\") return;"
    print "    const q = query("
    print "      collection(db, \"notifications\"),"
    print "      where(\"userId\", \"==\", userData.id),"
    print "      orderBy(\"createdAt\", \"desc\")"
    print "    );"
    print "    const unsubscribe = onSnapshot(q, (snapshot) => {"
    print "      const notifs: any[] = [];"
    print "      snapshot.forEach((doc) => {"
    print "        notifs.push({ id: doc.id, ...doc.data() });"
    print "      });"
    print "      setNotifications(notifs);"
    print "    });"
    print "    return () => unsubscribe();"
    print "  }, [userData]);\n"
    print "  const markNotificationAsRead = async (id: string) => {"
    print "    try {"
    print "      await updateDoc(doc(db, \"notifications\", id), { read: true });"
    print "    } catch (error) {"
    print "      console.error(\"Error updating notification:\", error);"
    print "    }"
    print "  };\n"
}
{print}
' src/components/Dashboard.tsx > src/components/Dashboard_temp.tsx
mv src/components/Dashboard_temp.tsx src/components/Dashboard.tsx
